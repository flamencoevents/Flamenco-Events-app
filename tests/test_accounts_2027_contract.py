"""Synthetic queue-to-contract-to-accounts rehearsal; no services or real data."""
import copy
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import accounts_2027_contract as bridge
from test_accounts_2027 import book
from test_accounts_2027_package import fixture as workbook_fixture
from accounts_2027_package import package

PDF = b'%PDF-1.4\nFICTITIOUS CONTRACT - NO VALIDITY\n%%EOF'


def fixture():
    quote = {'modelo': 'FE3', 'modoPrueba': True, 'id': 'X26-P900099', 'revision': 2,
             'key': 'X26-P900099-v2', 'request': {'cliente': 'CLIENTE FICTICIO', 'tipo_cliente': 'empresa'},
             'fields': {'fecha_evento': '12/03/2027', 'lugar_evento': 'LUGAR FICTICIO'},
             'calculo': {'total': 1060.01, 'base': 1000.01, 'facturada': 1000.01, 'iva': 210,
                         'irpf': 150, 'reserva': 0, 'pendiente': 1060.01, 'redondeoFiscal': 0,
                         'ajuste': -25, 'desgloseGastos': {'hotel': 0}}}
    contract = {'version': 1, 'presupuesto': copy.deepcopy(quote), 'cliente': {'nombre': 'PERSONA FICTICIA'}}
    return {'test_mode': True, 'source_system': 'whatsapp', 'source_sheet': 'FE_App_Pruebas',
            'candidate_row': 11, 'expected_pdf_sha256': hashlib.sha256(PDF).hexdigest(),
            'quote_row': [quote['key'], quote['id'], 2, 'GENERADO', json.dumps(quote)],
            'contract_row': [quote['id'], 'GENERADO', json.dumps(contract), '', '', '',
                             'https://drive.google.com/file/d/FICTITIOUS/view'],
            'event': {'id': 'TEST-EVENT', 'is_test': True, 'date': '2027-03-12', 'schedule': '18:00',
                      'quote_number': quote['id'], 'source_key': quote['key'], 'version': 2}}


class ContractRehearsalTests(unittest.TestCase):
    def setUp(self):
        self.data, self.book = fixture(), book()

    def blocked(self, code, pdf=PDF):
        with self.assertRaisesRegex(bridge.Blocked, '^' + code + '$'):
            bridge.prepare(self.book, self.data, pdf)

    def change_quote(self, change):
        q = json.loads(self.data['quote_row'][4])
        change(q)
        self.data['quote_row'][4] = json.dumps(q)
        c = json.loads(self.data['contract_row'][2])
        c['presupuesto'] = q
        self.data['contract_row'][2] = json.dumps(c)

    def test_whatsapp_contract_to_monthly_proposal_preserves_economics(self):
        original = copy.deepcopy(self.data)
        out = bridge.prepare(self.book, self.data, PDF)
        self.assertEqual(out['proposal']['proposed_cells']['H']['amount_cents'], 106001)
        self.assertEqual(out['proposal']['candidate_row'], 11)
        self.assertEqual(out['saved_calculation'], json.loads(self.data['quote_row'][4])['calculo'])
        self.assertEqual(out['saved_calculation']['reserva'], 0)
        self.assertFalse(out['production_writable'])
        for name in ('signature_verified', 'payment_verified', 'commercial_closure_verified',
                     'remote_origin_verified', 'balances_changed'):
            self.assertFalse(out[name])
        self.assertEqual(self.data, original)
        self.assertEqual(out, bridge.prepare(self.book, self.data, PDF))
        self.assertTrue(set('IJKLMNOPQ').isdisjoint(out['proposal']['proposed_cells']))

    def test_proposal_binds_source_sheet_and_contract_snapshot(self):
        initial = bridge.prepare(self.book, self.data, PDF)
        other_sheet = copy.deepcopy(self.data)
        other_sheet['source_sheet'] = 'FE_Cola'
        other_snapshot = copy.deepcopy(self.data)
        contract = json.loads(other_snapshot['contract_row'][2])
        contract['cliente']['nombre'] = 'OTRA PERSONA FICTICIA'
        other_snapshot['contract_row'][2] = json.dumps(contract)
        for changed in (other_sheet, other_snapshot):
            with self.subTest(sheet=changed['source_sheet']):
                result = bridge.prepare(self.book, changed, PDF)
                self.assertEqual(result['proposal']['proposed_cells'],
                                 initial['proposal']['proposed_cells'])
                self.assertNotEqual(result['proposal']['proposal_id'],
                                    initial['proposal']['proposal_id'])

    def test_proposal_binds_private_drive_reference_even_for_identical_pdf_bytes(self):
        with TemporaryDirectory() as temp:
            source, export, candidate = [Path(temp) / name for name in
                                         ('source.xlsx', 'export.xlsx', 'copy.xlsx')]
            workbook_fixture(source)
            book = bridge.read_book(source)
            initial = bridge.prepare(book, self.data, PDF)
            original_reference = self.data['contract_row'][6]
            other_reference = original_reference.rsplit('/', 2)[0] + '/OTHER_SYNTHETIC_PDF/view'
            self.data['contract_row'][6] = other_reference
            changed = bridge.prepare(book, self.data, PDF)
            self.assertEqual(initial['source']['pdf_sha256'], changed['source']['pdf_sha256'])
            self.assertEqual(initial['proposal']['proposed_cells'], changed['proposal']['proposed_cells'])
            self.assertNotIn(other_reference, json.dumps(changed))
            workbook_fixture(export, initial['proposal'])
            with self.assertRaisesRegex(bridge.Blocked, 'PROPOSAL_CHANGED'):
                package(source, export, changed['planner_request'], candidate,
                        expected_proposal_id=initial['proposal']['proposal_id'])
            self.assertFalse(candidate.exists())
            self.assertFalse(list(Path(temp).glob('.fe-copy-*')))

    def test_contract_proposal_can_be_audited_in_a_synthetic_copy(self):
        with TemporaryDirectory() as temp:
            source, export, candidate = [Path(temp) / name for name in
                                         ('source.xlsx', 'export.xlsx', 'copy.xlsx')]
            workbook_fixture(source)
            original = source.read_bytes()
            prepared = bridge.prepare(bridge.read_book(source), self.data, PDF)
            workbook_fixture(export, prepared['proposal'])
            result = package(source, export, prepared['planner_request'], candidate)
            self.assertEqual(result['audit']['differences'], [])
            self.assertFalse(result['production_writable'])
            self.assertEqual(bridge.read_book(candidate)['cells']['H11']['value'], '1060.01')
            self.assertEqual(source.read_bytes(), original)

    def test_numeric_overflow_in_saved_snapshot_is_rejected(self):
        with self.assertRaisesRegex(bridge.Blocked, '^INVALID_JSON_NUMBER$'):
            bridge.parsed('{"calculo":{"ajuste":1e999}}')

    def test_subcent_amount_cannot_be_rounded_by_json_parser(self):
        for raw_amount in ('1060.01000000000001', '1e-400'):
            with self.subTest(raw_amount=raw_amount):
                self.data = fixture()
                for row, index in (('quote_row', 4), ('contract_row', 2)):
                    self.data[row][index] = self.data[row][index].replace(
                        '"total": 1060.01', '"total": ' + raw_amount)
                self.blocked('INVALID_JSON_NUMBER')

    def test_equivalent_json_number_notation_is_accepted(self):
        self.assertEqual(bridge.parsed('{"total":1.060010e3}')['total'], 1060.01)

    def test_generated_contract_is_not_signed_paid_or_closed(self):
        out = bridge.prepare(self.book, self.data, PDF)
        self.assertEqual(out['status'], 'pending_review')
        self.assertIn('closure_rules', out['pending'])
        self.data['contract_row'][1] = 'LISTO'
        self.blocked('DOCUMENT_NOT_GENERATED')

    def test_quote_contract_snapshot_and_event_bindings(self):
        c = json.loads(self.data['contract_row'][2])
        c['presupuesto']['calculo']['iva'] = 211
        self.data['contract_row'][2] = json.dumps(c)
        self.blocked('CONTRACT_SNAPSHOT_CHANGED')
        self.data = fixture()
        self.data['event']['version'] = 1
        self.blocked('EVENT_SOURCE_MISMATCH')
        self.data = fixture()
        self.data['quote_row'][2] = True
        self.blocked('QUEUE_IDENTITY_MISMATCH')

    def test_pdf_bytes_digest_reference_and_size(self):
        self.blocked('INVALID_PDF_BYTES', b'NOT PDF')
        self.blocked('PDF_DIGEST_MISMATCH', PDF + b'changed')
        self.data['contract_row'][6] = 'https://evil.invalid/file'
        self.blocked('MISSING_PRIVATE_PDF_REFERENCE')

    def test_real_inputs_and_unsupported_source_rejected(self):
        self.data['test_mode'] = False
        self.blocked('FICTIONAL_ONLY')
        self.data = fixture()
        self.change_quote(lambda q: q.update(modoPrueba=False))
        self.blocked('FICTIONAL_ONLY')
        self.data = fixture()
        self.data['source_sheet'] = 'OTHER'
        self.blocked('WRONG_SOURCE')

    def test_dates_schedule_and_injection_not_inferred(self):
        self.change_quote(lambda q: q['fields'].update(fecha_evento='12/03/27'))
        self.blocked('AMBIGUOUS_EVENT_DATE')
        self.data = fixture()
        self.data['event']['schedule'] = ''
        self.blocked('INVALID_TEXT')
        self.data = fixture()
        self.change_quote(lambda q: q['fields'].update(lugar_evento='=HYPERLINK("x")'))
        self.blocked('FORMULA_LIKE_TEXT')

    def test_amounts_are_exact_and_not_recalculated(self):
        for bad in (True, float('nan'), 1060.001, '1060.01'):
            self.data = fixture()
            self.change_quote(lambda q: q['calculo'].update(total=bad))
            with self.assertRaises((bridge.Blocked, ValueError)):
                bridge.prepare(self.book, self.data, PDF)

    def test_unapproved_cash_clause_rejected(self):
        self.change_quote(lambda q: q['request'].update(forma_cobro='efectivo100'))
        self.blocked('CONTRACT_CLAUSE_NOT_APPROVED')

    def test_bizum_contract_terms_separate_from_saved_quote(self):
        self.change_quote(lambda q: q['request'].update(tipo_cliente='particular_base'))
        c = json.loads(self.data['contract_row'][2])
        c['cliente'].update(bizum='+34600000000', reservaBizum=100)
        self.data['contract_row'][2] = json.dumps(c)
        out = bridge.prepare(self.book, self.data, PDF)
        self.assertEqual(out['saved_calculation']['reserva'], 0)
        self.assertEqual(out['contract_payment']['reservaBizum'], 100)
        self.assertNotIn('I', out['proposal']['proposed_cells'])

    def test_existing_number_and_month_conflicts_use_planner_guards(self):
        self.book['cells']['C10'] = {'value': 'X26-P900099', 'formula': False}
        self.blocked('EXISTING_NUMBER_REQUIRES_RECONCILIATION')
        self.book = book()
        self.book['markers'] = [(9, 4)]
        self.blocked('MONTH_MISSING_OR_AMBIGUOUS')

    def test_invalid_json_and_cli_fail_closed_without_private_error(self):
        with self.assertRaisesRegex(bridge.Blocked, 'DUPLICATE_JSON_KEY'):
            bridge.parsed('{"test_mode":true,"test_mode":false}')
        run = subprocess.run([sys.executable, str(Path(bridge.__file__)), '/missing-book', '/missing-json',
                              '/missing-pdf'], capture_output=True, text=True)
        self.assertEqual(run.returncode, 2)
        self.assertEqual(json.loads(run.stdout)['reason'], 'INVALID_INPUT')
        self.assertNotIn('/missing', run.stdout + run.stderr)


if __name__ == '__main__':
    unittest.main()
