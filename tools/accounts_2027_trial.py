"""Journaled local rehearsal. No network, remote write or business activation.

The Node command must use the existing Artifact Tool runtime. Caller-supplied
keys identify a local rehearsal only; they are not user authorization.
"""
import argparse
from contextlib import contextmanager
import fcntl
import json
import os
from pathlib import Path
import subprocess

from accounts_2027 import Blocked, propose, read_book, require
from accounts_2027_ledger import Ledger


@contextmanager
def exclusive_trial(database):
    # Never unlink this file: another process may still hold its inode open.
    # An OS lock is released on crash, while the durable reservation survives.
    lock = Path(str(Path(database).resolve()) + '.trial.lock')
    with lock.open('a') as handle:
        try:
            fcntl.flock(handle, fcntl.LOCK_EX | fcntl.LOCK_NB)
        except BlockingIOError:
            raise Blocked('LOCAL_TRIAL_ACTIVE') from None
        try:
            yield
        finally:
            fcntl.flock(handle, fcntl.LOCK_UN)


def run_trial(source, request_path, output, database, workbook_key, owner_key,
              node_command, *, runner=subprocess.run):
    """Serialize cooperating trials and independently verify actual output bytes.

    Failed runs retain diagnostic files and a terminal failed journal entry.
    A crash keeps the reservation; only the same owner/unchanged request can
    resume it, with a NEW output directory. No implicit lease expiration.
    """
    source, request_path, output, database = map(Path, (source, request_path, output, database))
    require(bool(node_command), 'ARTIFACT_RUNTIME_REQUIRED')
    request = json.loads(request_path.read_text())
    # Keep database/lock away from the input and request even on a wrong CLI.
    protected = {source.resolve(), request_path.resolve()}
    require(database.resolve() not in protected and
            Path(str(database.resolve()) + '.trial.lock').resolve() not in protected,
            'JOURNAL_INPUT_COLLISION')
    # Creating the journal inside a fresh output directory conflicts with the writer.
    output_path = output.resolve()
    journal_path = database.resolve()
    require(journal_path != output_path and output_path not in journal_path.parents,
            'JOURNAL_OUTPUT_COLLISION')
    book = read_book(source)
    proposal = propose(book, request)
    with exclusive_trial(database):
        ledger = Ledger(database)
        # An accidental duplicate CLI must not turn a pending operation
        # into a terminal failure.
        with ledger.transaction() as db:
            previous = db.execute('SELECT state FROM operations WHERE proposal_id = ?',
                                  (proposal['proposal_id'],)).fetchone()
        if not previous or previous['state'] == 'reserved':
            require(not output.exists() and not output.is_symlink(), 'OUTPUT_ALREADY_EXISTS')
        operation = ledger.reserve(workbook_key, owner_key, book, request)
        require(operation['state'] != 'failed', 'OPERATION_FAILED')
        candidate = output / 'preserved.candidate.xlsx'
        if operation['state'] == 'copy_verified':
            # A cached success is not evidence the file is still intact.
            return ledger.verify_copy(operation['proposal_id'], owner_key, source, candidate, request)
        try:
            env = dict(os.environ, FE_ACCOUNTS_PLANNER=str(Path(__file__).with_name('accounts_2027.py')),
                       FE_ACCOUNTS_PYTHON=os.sys.executable,
                       FE_ACCOUNTS_EXPECTED_PROPOSAL_ID=operation['proposal_id'])
            result = runner([*node_command, str(source.resolve()), str(request_path.resolve()),
                             str(output.resolve())], env=env, stdout=subprocess.DEVNULL,
                            stderr=subprocess.DEVNULL, check=False, timeout=180)
            require(result.returncode == 0, 'LOCAL_COPY_PROCESS_FAILED')
            return ledger.verify_copy(operation['proposal_id'], owner_key, source, candidate, request)
        except Exception:
            # A definite local failure can release the book. Hard crashes retain
            # the reservation. There is no uncertain remote commit to classify.
            ledger.fail(operation['proposal_id'], owner_key)
            raise


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    for name in ('source', 'request', 'output', 'database', 'workbook_key', 'owner_key'):
        parser.add_argument(name)
    parser.add_argument('--node', required=True, help='Absolute bundled runtime Node executable')
    parser.add_argument('--writer', required=True, help='Runtime-local copy of accounts_2027_roundtrip.mjs')
    args = parser.parse_args()
    try:
        result = run_trial(args.source, args.request, args.output, args.database,
                           args.workbook_key, args.owner_key, [args.node, args.writer])
    except Exception as exc:
        result = {'state': 'blocked', 'production_writable': False, 'remote_committed': False,
                  'reason': str(exc) if isinstance(exc, Blocked) else 'LOCAL_TRIAL_FAILED'}
    print(json.dumps(result))
    raise SystemExit(0 if result['state'] == 'copy_verified' else 2)


if __name__ == '__main__':
    main()
