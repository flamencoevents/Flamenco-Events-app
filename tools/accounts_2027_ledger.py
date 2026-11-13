"""Local fictitious operation journal. Never writes XLSX or calls a service.

This prepares exclusion/idempotency rules, not a remote commit protocol. Use a
private local database. No customer fields, document URLs or PDF bytes stored.
An abandoned reservation stays blocked until explicitly failed by its owner.
"""
from contextlib import contextmanager
import re
import sqlite3

from accounts_2027 import digest, propose, require


class Ledger:
    def __init__(self, path):
        self.path = str(path)
        with self.transaction() as db:
            db.execute('''CREATE TABLE IF NOT EXISTS operations (
                proposal_id TEXT PRIMARY KEY,
                workbook_key TEXT NOT NULL,
                source_sha256 TEXT NOT NULL,
                event_key TEXT NOT NULL,
                owner_key TEXT NOT NULL,
                state TEXT NOT NULL CHECK(state IN ('reserved','copy_verified','failed')),
                candidate_sha256 TEXT,
                UNIQUE(workbook_key, event_key)
            )''')
            db.execute('''CREATE UNIQUE INDEX IF NOT EXISTS one_active_copy
                ON operations(workbook_key) WHERE state = 'reserved' ''')

    @contextmanager
    def transaction(self):
        db = sqlite3.connect(self.path, timeout=1, isolation_level=None)
        db.row_factory = sqlite3.Row
        try:
            db.execute('BEGIN IMMEDIATE')
            yield db
            db.commit()
        except BaseException:
            db.rollback()
            raise
        finally:
            db.close()

    @staticmethod
    def checked_key(value):
        require(isinstance(value, str) and re.fullmatch('[a-f0-9]{64}', value), 'INVALID_LEDGER_KEY')
        return value

    @staticmethod
    def result(row):
        return {'proposal_id': row['proposal_id'], 'state': row['state'],
                'candidate_sha256': row['candidate_sha256'],
                'production_writable': False, 'remote_committed': False}

    def reserve(self, workbook_key, owner_key, book, request):
        """Rebuild proposal; serialize all pending copies of one logical book.

        Caller keys are opaque SHA-256 identifiers, not authorization tokens.
        An exact retry by the same owner returns its existing terminal/pending
        state. Another revision/row/amount for that event needs reconciliation.
        """
        self.checked_key(workbook_key)
        self.checked_key(owner_key)
        proposal = propose(book, request)
        event_key = digest({'event_id': proposal['identity']['event_id']})
        with self.transaction() as db:
            old = db.execute('SELECT * FROM operations WHERE proposal_id = ?',
                             (proposal['proposal_id'],)).fetchone()
            if old:
                require(old['workbook_key'] == workbook_key and old['owner_key'] == owner_key,
                        'OPERATION_OWNER_CONFLICT')
                return self.result(old)
            require(not db.execute('SELECT 1 FROM operations WHERE workbook_key = ? AND event_key = ?',
                                   (workbook_key, event_key)).fetchone(), 'EVENT_REQUIRES_RECONCILIATION')
            require(not db.execute("SELECT 1 FROM operations WHERE workbook_key = ? AND state = 'reserved'",
                                   (workbook_key,)).fetchone(), 'WORKBOOK_OPERATION_ACTIVE')
            db.execute('INSERT INTO operations VALUES (?,?,?,?,?,?,NULL)',
                       (proposal['proposal_id'], workbook_key, proposal['workbook_sha256'],
                        event_key, owner_key, 'reserved'))
            return self.result(db.execute('SELECT * FROM operations WHERE proposal_id = ?',
                                         (proposal['proposal_id'],)).fetchone())

    def fail(self, proposal_id, owner_key):
        """Explicitly release a failed local rehearsal; never mark it committed."""
        self.checked_key(owner_key)
        with self.transaction() as db:
            row = db.execute('SELECT * FROM operations WHERE proposal_id = ?', (proposal_id,)).fetchone()
            require(row is not None, 'OPERATION_NOT_FOUND')
            require(row['owner_key'] == owner_key, 'OPERATION_OWNER_CONFLICT')
            require(row['state'] in ('reserved', 'failed'), 'OPERATION_ALREADY_VERIFIED')
            db.execute("UPDATE operations SET state = 'failed' WHERE proposal_id = ?", (proposal_id,))
            return self.result(db.execute('SELECT * FROM operations WHERE proposal_id = ?',
                                         (proposal_id,)).fetchone())

    def verify_copy(self, proposal_id, owner_key, source, candidate, request):
        """Run the independent audit, never trust an audit JSON from a caller."""
        from accounts_2027 import read_book
        from accounts_2027_verify import verify
        self.checked_key(owner_key)
        with self.transaction() as db:
            row = db.execute('SELECT * FROM operations WHERE proposal_id = ?', (proposal_id,)).fetchone()
            require(row is not None, 'OPERATION_NOT_FOUND')
            require(row['owner_key'] == owner_key, 'OPERATION_OWNER_CONFLICT')
            require(row['state'] in ('reserved', 'copy_verified'), 'OPERATION_FAILED')
            proposal = propose(read_book(source), request)
            require(proposal['proposal_id'] == proposal_id and
                    proposal['workbook_sha256'] == row['source_sha256'], 'PROPOSAL_CHANGED')
            audit = verify(source, candidate, request)
            require(audit['status'] == 'copy_preservation_checks_passed', 'PRESERVATION_AUDIT_REJECTED')
            require(audit['proposal_id'] == proposal_id and
                    audit['source_sha256'] == row['source_sha256'], 'PROPOSAL_CHANGED')
            require(row['candidate_sha256'] in (None, audit['candidate_sha256']), 'CANDIDATE_CHANGED')
            db.execute("UPDATE operations SET state = 'copy_verified', candidate_sha256 = ? WHERE proposal_id = ?",
                       (audit['candidate_sha256'], proposal_id))
            return self.result(db.execute('SELECT * FROM operations WHERE proposal_id = ?',
                                         (proposal_id,)).fetchone())
