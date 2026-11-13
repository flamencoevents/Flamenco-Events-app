"""Process/journal integration using synthetic packages, never external services."""
import json
from pathlib import Path
import sqlite3
import subprocess
import sys
import tempfile
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from accounts_2027 import Blocked, propose, read_book
from accounts_2027_package import package
from accounts_2027_trial import run_trial
from test_accounts_2027 import request
from test_accounts_2027_package import fixture


class TrialTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.root = Path(self.tmp.name)
        self.source = self.root / 'source.xlsx'
        self.req_path = self.root / 'request.json'
        self.output = self.root / 'trial'
        self.database = self.root / 'journal.sqlite'
        fixture(self.source)
        self.original = self.source.read_bytes()
        self.req = request()
        self.req['workbook_sha256'] = read_book(self.source)['sha256']
        self.req_path.write_text(json.dumps(self.req))
        self.calls = 0

    def writer(self, command, **kwargs):
        self.calls += 1
        source, request_path, output = map(Path, command[-3:])
        req = json.loads(request_path.read_text())
        output.mkdir()
        artifact = output / 'unverified.candidate.xlsx'
        fixture(artifact, propose(read_book(source), req))
        package(source, artifact, req, output / 'preserved.candidate.xlsx')
        return subprocess.CompletedProcess(command, 0)

    def run_trial(self, runner=None, output=None, owner='b'*64):
        return run_trial(self.source, self.req_path, output or self.output, self.database,
                         'a'*64, owner, ['synthetic-runtime', 'synthetic-writer'],
                         runner=runner or self.writer)

    def state(self):
        with sqlite3.connect(self.database) as db:
            return db.execute('SELECT state FROM operations').fetchone()[0]

    def test_writer_receives_reserved_proposal_id(self):
        expected = propose(read_book(self.source), self.req)['proposal_id']

        def check_reservation(command, **kwargs):
            self.assertEqual(kwargs['env'].get('FE_ACCOUNTS_EXPECTED_PROPOSAL_ID'), expected)
            return self.writer(command, **kwargs)

        self.assertEqual(self.run_trial(check_reservation)['state'], 'copy_verified')

    def test_copy_audited_and_identical_retry_skips_writer(self):
        result = self.run_trial()
        self.assertEqual(result['state'], 'copy_verified')
        self.assertEqual(result, self.run_trial())
        self.assertEqual(self.calls, 1)
        self.assertFalse(result['remote_committed'])
        self.assertFalse(result['production_writable'])
        self.assertEqual(self.source.read_bytes(), self.original)

    def test_audit_cannot_verify_a_different_contract_proposal(self):
        from unittest.mock import patch
        from accounts_2027_verify import verify

        def audit_changed_request(source, candidate, request):
            changed = dict(request, contract=dict(request['contract'], sha256='c' * 64))
            return verify(source, candidate, changed)

        with patch('accounts_2027_verify.verify', side_effect=audit_changed_request):
            with self.assertRaisesRegex(Blocked, 'PROPOSAL_CHANGED'):
                self.run_trial()
        self.assertEqual(self.state(), 'failed')
        self.assertEqual(self.source.read_bytes(), self.original)
        with sqlite3.connect(self.database) as db:
            self.assertIsNone(db.execute('SELECT candidate_sha256 FROM operations').fetchone()[0])

    def test_exit_zero_and_forged_audit_do_not_certify_invalid_copy(self):
        def forged(command, **kwargs):
            self.output.mkdir()
            fixture(self.output / 'preserved.candidate.xlsx')
            (self.output / 'audit.json').write_text('{"status":"copy_preservation_checks_passed"}')
            return subprocess.CompletedProcess(command, 0)
        with self.assertRaisesRegex(Blocked, 'PRESERVATION_AUDIT_REJECTED'):
            self.run_trial(forged)
        self.assertEqual(self.state(), 'failed')
        self.assertEqual(self.source.read_bytes(), self.original)
        with self.assertRaisesRegex(Blocked, 'OPERATION_FAILED'):
            self.run_trial(output=self.root / 'retry')

    def test_nonzero_and_timeout_release_reservation(self):
        def nonzero(command, **kwargs):
            return subprocess.CompletedProcess(command, 2)
        with self.assertRaisesRegex(Blocked, 'LOCAL_COPY_PROCESS_FAILED'):
            self.run_trial(nonzero)
        self.assertEqual(self.state(), 'failed')
        # A separate logical event can proceed after a definite local failure.
        self.req['event']['id'] = self.req['contract']['event_id'] = 'TEST-SECOND'
        self.req_path.write_text(json.dumps(self.req))
        def timeout(command, **kwargs):
            raise subprocess.TimeoutExpired(command, 180)
        with self.assertRaises(subprocess.TimeoutExpired):
            self.run_trial(timeout)
        with sqlite3.connect(self.database) as db:
            self.assertEqual(db.execute("SELECT count(*) FROM operations WHERE state='reserved'").fetchone()[0], 0)

    def test_concurrent_identical_invocation_cannot_run_second_writer(self):
        def concurrent(command, **kwargs):
            with self.assertRaisesRegex(Blocked, 'LOCAL_TRIAL_ACTIVE'):
                self.run_trial(output=self.root / 'parallel')
            return self.writer(command, **kwargs)
        self.assertEqual(self.run_trial(concurrent)['state'], 'copy_verified')
        self.assertEqual(self.calls, 1)

    def test_crash_retains_reservation_and_same_owner_can_resume(self):
        def crash(command, **kwargs):
            self.output.mkdir()
            raise KeyboardInterrupt()
        with self.assertRaises(KeyboardInterrupt):
            self.run_trial(crash)
        self.assertEqual(self.state(), 'reserved')
        with self.assertRaisesRegex(Blocked, 'OUTPUT_ALREADY_EXISTS'):
            self.run_trial()
        self.assertEqual(self.state(), 'reserved')
        with self.assertRaisesRegex(Blocked, 'OPERATION_OWNER_CONFLICT'):
            self.run_trial(output=self.root / 'other-owner', owner='c'*64)
        self.assertEqual(self.run_trial(output=self.root / 'resumed')['state'], 'copy_verified')

    def test_verified_retry_detects_changed_output_without_rewriting_it(self):
        self.run_trial()
        fixture(self.output / 'preserved.candidate.xlsx')
        with self.assertRaisesRegex(Blocked, 'PRESERVATION_AUDIT_REJECTED'):
            self.run_trial()
        self.assertEqual(self.state(), 'copy_verified')
        self.assertEqual(self.calls, 1)

    def test_real_flag_and_journal_input_collision_cannot_invoke_writer(self):
        self.database = self.source
        with self.assertRaisesRegex(Blocked, 'JOURNAL_INPUT_COLLISION'):
            self.run_trial()
        self.assertEqual(self.source.read_bytes(), self.original)
        self.database = self.root / 'private.sqlite'
        self.req['test_mode'] = False
        self.req_path.write_text(json.dumps(self.req))
        with self.assertRaisesRegex(Blocked, 'FICTIONAL_ONLY'):
            self.run_trial()
        self.assertEqual(self.calls, 0)
        self.assertFalse(self.database.exists())
        self.assertFalse(Path(str(self.database) + '.trial.lock').exists())

    def test_cli_launches_child_process_and_rechecks_output_on_retry(self):
        repo = Path(__file__).resolve().parents[1]
        writer = self.root / 'synthetic-writer.py'
        writer.write_text(
            'import json, sys\nfrom pathlib import Path\n'
            f'sys.path[:0] = {list(map(str, (repo / "tools", repo / "tests")))!r}\n'
            'from accounts_2027 import propose, read_book\n'
            'from accounts_2027_package import package\n'
            'from test_accounts_2027_package import fixture\n'
            'source, request, output = map(Path, sys.argv[1:])\n'
            'req = json.loads(request.read_text())\noutput.mkdir()\n'
            'artifact = output / "unverified.candidate.xlsx"\n'
            'fixture(artifact, propose(read_book(source), req))\n'
            'package(source, artifact, req, output / "preserved.candidate.xlsx")\n')
        command = [sys.executable, str(repo / 'tools/accounts_2027_trial.py'),
                   str(self.source), str(self.req_path), str(self.output), str(self.database),
                   'a'*64, 'b'*64, '--node', sys.executable, '--writer', str(writer)]
        result = subprocess.run(command, capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(json.loads(result.stdout)['state'], 'copy_verified')
        # Removing the writer proves retry does not launch another process.
        writer.unlink()
        retry = subprocess.run(command, capture_output=True, text=True, check=False)
        self.assertEqual(retry.returncode, 0, retry.stderr)
        self.assertEqual(json.loads(retry.stdout), json.loads(result.stdout))
        self.assertEqual(self.source.read_bytes(), self.original)


if __name__ == '__main__':
    unittest.main()
