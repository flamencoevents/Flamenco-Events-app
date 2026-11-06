"""Fictitious local databases/packages; no external accounts or business data."""
import copy
from concurrent.futures import ThreadPoolExecutor
import hashlib
from pathlib import Path
import sqlite3
import sys
import tempfile
import threading
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from accounts_2027 import Blocked, propose, read_book
from accounts_2027_ledger import Ledger
from accounts_2027_package import package
from test_accounts_2027 import request
from test_accounts_2027_package import fixture


class LedgerTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.source, self.artifact, self.output = [self.root / n for n in ('source.xlsx', 'artifact.xlsx', 'copy.xlsx')]
        fixture(self.source)
        self.book = read_book(self.source)
        self.req = request()
        self.req['workbook_sha256'] = self.book['sha256']
        self.proposal = propose(self.book, self.req)
        fixture(self.artifact, self.proposal)
        self.path = self.root / 'private.sqlite'
        self.ledger = Ledger(self.path)
        self.key, self.owner = 'a' * 64, 'b' * 64

    def reserve(self, req=None, owner=None):
        return self.ledger.reserve(self.key, owner or self.owner, self.book, req or self.req)

    def other_event(self):
        req = copy.deepcopy(self.req)
        req['event']['id'] = req['contract']['event_id'] = 'TEST-OTHER'
        return req

    def test_restart_and_exact_retry_return_one_operation_without_private_fields(self):
        first = self.reserve()
        self.ledger = Ledger(self.path)
        self.assertEqual(first, self.reserve())
        with sqlite3.connect(self.path) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM operations').fetchone()[0], 1)
        raw = self.path.read_bytes()
        for private in ('Cliente ficticio', 'Lugar ficticio', '18:00', '00926'):
            self.assertNotIn(private.encode(), raw)
        self.assertFalse(first['production_writable'])
        self.assertFalse(first['remote_committed'])

    def test_same_event_changed_amount_revision_or_row_requires_reconciliation(self):
        self.reserve()
        for field in ('amount', 'revision', 'row'):
            req = copy.deepcopy(self.req)
            if field == 'row':
                req['candidate_row'] = 12
            else:
                key = 'total_cents' if field == 'amount' else 'revision'
                for part in ('quotation', 'contract'):
                    req[part][key] += 1
            with self.assertRaisesRegex(Blocked, 'EVENT_REQUIRES_RECONCILIATION'):
                self.reserve(req)

    def test_distinct_event_is_blocked_while_workbook_reserved(self):
        self.reserve()
        with self.assertRaisesRegex(Blocked, 'WORKBOOK_OPERATION_ACTIVE'):
            self.reserve(self.other_event())

    def test_failed_operation_releases_slot_but_retry_cannot_resurrect(self):
        op = self.reserve()
        failed = self.ledger.fail(op['proposal_id'], self.owner)
        self.assertEqual(failed, self.ledger.fail(op['proposal_id'], self.owner))
        self.assertEqual(self.reserve()['state'], 'failed')
        self.assertEqual(self.reserve(self.other_event())['state'], 'reserved')

    def test_other_owner_cannot_retry_release_or_verify(self):
        op = self.reserve()
        for action in (lambda: self.reserve(owner='c'*64),
                       lambda: self.ledger.fail(op['proposal_id'], 'c'*64),
                       lambda: self.ledger.verify_copy(op['proposal_id'], 'c'*64, self.source, self.output, self.req)):
            with self.assertRaisesRegex(Blocked, 'OPERATION_OWNER_CONFLICT'):
                action()

    def test_rejected_audit_retains_reservation_and_leaves_source_intact(self):
        before = self.source.read_bytes()
        op = self.reserve()
        fixture(self.output)
        with self.assertRaisesRegex(Blocked, 'PRESERVATION_AUDIT_REJECTED'):
            self.ledger.verify_copy(op['proposal_id'], self.owner, self.source, self.output, self.req)
        self.assertEqual(self.reserve()['state'], 'reserved')
        self.assertEqual(self.source.read_bytes(), before)

    def test_verified_copy_is_terminal_and_never_a_remote_receipt(self):
        op = self.reserve()
        package(self.source, self.artifact, self.req, self.output)
        result = self.ledger.verify_copy(op['proposal_id'], self.owner, self.source, self.output, self.req)
        self.assertEqual(result['state'], 'copy_verified')
        self.assertEqual(result['candidate_sha256'], hashlib.sha256(self.output.read_bytes()).hexdigest())
        self.assertEqual(result, self.ledger.verify_copy(op['proposal_id'], self.owner, self.source, self.output, self.req))
        self.assertFalse(result['remote_committed'])
        with self.assertRaisesRegex(Blocked, 'OPERATION_ALREADY_VERIFIED'):
            self.ledger.fail(op['proposal_id'], self.owner)

    def test_concurrent_connections_allow_only_one_workbook_reservation(self):
        barrier = threading.Barrier(2)
        def run(req):
            ledger = Ledger(self.path)
            barrier.wait()
            try:
                return ledger.reserve(self.key, self.owner, self.book, req)['state']
            except Blocked as exc:
                return str(exc)
        with ThreadPoolExecutor(max_workers=2) as pool:
            results = list(pool.map(run, (self.req, self.other_event())))
        self.assertCountEqual(results, ['reserved', 'WORKBOOK_OPERATION_ACTIVE'])

    def test_real_data_flag_rejected_without_journal_entry(self):
        self.req['test_mode'] = False
        with self.assertRaisesRegex(Blocked, 'FICTIONAL_ONLY'):
            self.reserve()
        with sqlite3.connect(self.path) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM operations').fetchone()[0], 0)

    def test_modified_request_cannot_complete_existing_operation(self):
        op = self.reserve()
        changed = copy.deepcopy(self.req)
        changed['event']['schedule'] = '19:00'
        with self.assertRaisesRegex(Blocked, 'PROPOSAL_CHANGED'):
            self.ledger.verify_copy(op['proposal_id'], self.owner, self.source, self.output, changed)
        self.assertEqual(self.reserve()['state'], 'reserved')

    def test_failed_operation_cannot_be_marked_verified(self):
        op = self.reserve()
        self.ledger.fail(op['proposal_id'], self.owner)
        with self.assertRaisesRegex(Blocked, 'OPERATION_FAILED'):
            self.ledger.verify_copy(op['proposal_id'], self.owner, self.source, self.output, self.req)

    def test_separate_workbooks_and_transaction_rollback(self):
        self.reserve()
        self.ledger.reserve('d'*64, self.owner, self.book, self.other_event())
        with self.assertRaisesRegex(RuntimeError, 'synthetic failure'):
            with self.ledger.transaction() as db:
                db.execute('DELETE FROM operations')
                raise RuntimeError('synthetic failure')
        with sqlite3.connect(self.path) as db:
            self.assertEqual(db.execute('SELECT count(*) FROM operations').fetchone()[0], 2)


if __name__ == '__main__':
    unittest.main()
