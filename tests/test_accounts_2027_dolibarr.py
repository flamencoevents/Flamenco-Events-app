"""Synthetic contract, XLSX copy, and Dolibarr projection through normal functions."""
from pathlib import Path
from tempfile import TemporaryDirectory
import unittest
from io import BytesIO
from unittest.mock import patch
from urllib.error import HTTPError

from test_accounts_2027_contract import PDF, bridge, fixture, package, workbook_fixture
from accounts_2027_dolibarr import fetch_trial_invoice, prepare_invoice
from test_accounts_2027 import book


def invoice():
    return {'is_test': True, 'id': '42', 'ref': 'TEST-INV-42', 'type': '0',
            'ref_ext': 'X26-P900099-v2', 'currency': 'EUR',
            'total_ht': '900.1000', 'total_tva': '189.02', 'total_ttc': '1089.12',
            'paye': '1', 'note_private': 'FICTICIOUS_PRIVATE_NOTE'}


class InvoiceTests(unittest.TestCase):
    def test_quote_contract_copy_and_invoice_keep_amounts_separate(self):
        with TemporaryDirectory() as tmp:
            source, export, candidate = [Path(tmp) / f'{name}.xlsx'
                                         for name in ('source', 'export', 'candidate')]
            workbook_fixture(source)
            original = source.read_bytes()
            rehearsal = bridge.prepare(bridge.read_book(source), fixture(), PDF)
            workbook_fixture(export, rehearsal['proposal'])
            audit = package(source, export, rehearsal['planner_request'], candidate,
                            expected_proposal_id=rehearsal['proposal']['proposal_id'])
            invoice_view = prepare_invoice(rehearsal, invoice(), test_mode=True)
            self.assertEqual(audit['audit']['differences'], [])
            self.assertEqual(source.read_bytes(), original)
            self.assertEqual(invoice_view['proposal_id'], rehearsal['proposal']['proposal_id'])
            self.assertEqual(invoice_view['forecast_total_cents'], 106001)
            self.assertEqual(invoice_view['invoice_total_cents'], 108912)
            self.assertEqual((invoice_view['net_cents'], invoice_view['vat_cents']), (90010, 18902))
            self.assertFalse(invoice_view['payment_verified'])
            self.assertFalse(invoice_view['production_writable'])
            self.assertNotIn('FICTICIOUS_PRIVATE_NOTE', str(invoice_view))

    def test_rejects_unlinked_and_out_of_scope_invoices(self):
        rehearsal = bridge.prepare(book(), fixture(), PDF)
        for patch, reason in (
            ({'ref_ext': 'X26-P900099-v1'}, 'INVOICE_SOURCE_MISMATCH'),
            ({'is_test': False}, 'FICTIONAL_ONLY'),
            ({'currency': 'USD'}, 'INVOICE_CURRENCY_UNSUPPORTED'),
            ({'type': '2'}, 'INVOICE_TYPE_UNSUPPORTED'),
            ({'total_ttc': '1089.121'}, 'INVALID_INVOICE_AMOUNT'),
        ):
            with self.subTest(reason=reason), self.assertRaisesRegex(bridge.Blocked, reason):
                prepare_invoice(rehearsal, dict(invoice(), **patch), test_mode=True)
        with self.assertRaisesRegex(bridge.Blocked, 'FICTIONAL_ONLY'):
            prepare_invoice(rehearsal, invoice(), test_mode=False)


    @patch('accounts_2027_dolibarr.build_opener')
    def test_reads_one_fixture_and_minimizes_export(self, opener):
        opener.return_value.open.return_value = BytesIO(
            b'{"id":42,"ref":"TEST-INV-42","type":0,"ref_ext":"X26-P900099-v2",'
            b'"total_ht":900.10,"total_tva":"189.02","total_ttc":1089.12,'
            b'"note_private":"FICTITIOUS_PRIVATE_NOTE","paye":1}')
        url = 'https://sandbox.example.invalid/dolibarr'
        out = fetch_trial_invoice(url, 'fixture-key', '42', 'X26-P900099-v2', test_mode=True)
        req = opener.return_value.open.call_args.args[0]
        self.assertEqual(req.get_method(), 'GET')
        self.assertEqual(req.full_url, url + '/api/index.php/invoices/42?contact_list=-1')
        self.assertEqual(req.get_header('Dolapikey'), 'fixture-key')
        self.assertEqual(out, {k: v for k, v in invoice().items() if k not in ('paye', 'note_private')}
                         | {'total_ht': '900.10'})

    @patch('accounts_2027_dolibarr.build_opener')
    def test_blocks_real_mode_and_sanitizes_provider_errors(self, opener):
        args = ('https://sandbox.example.invalid', 'fixture-key', '42', 'X26-P900099-v2')
        with self.assertRaisesRegex(bridge.Blocked, 'FICTIONAL_ONLY'):
            fetch_trial_invoice(*args, test_mode=False)
        opener.assert_not_called()
        opener.return_value.open.side_effect = HTTPError(args[0], 302, 'PRIVATE', {}, None)
        with self.assertRaisesRegex(bridge.Blocked, '^DOLIBARR_TEST_READ_FAILED$'):
            fetch_trial_invoice(*args, test_mode=True)
        handler = opener.call_args.args[0]
        self.assertIsNone(handler.redirect_request(None, None, 302, '', {}, 'https://other.invalid'))
