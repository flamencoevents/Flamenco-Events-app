"""Synthetic in-memory fixtures only. No business workbook or online services."""
import copy
import hashlib
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from xml.sax.saxutils import escape
import zipfile

SOURCE = Path(__file__).resolve().parents[1] / 'tools/accounts_2027.py'
spec = importlib.util.spec_from_file_location('accounts_2027', SOURCE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def request():
    quote = {'number': '00926', 'key': 'TEST-00926-v2', 'revision': 2,
             'sha256': 'a' * 64, 'total_cents': 121099}
    return {'test_mode': True, 'workbook_sha256': 'f' * 64, 'currency': 'EUR',
            'candidate_row': 11,
            'event': {'is_test': True, 'id': 'TEST-EVENT', 'date': '2027-03-12',
                      'schedule': '18:00', 'place': 'Lugar ficticio', 'client': 'Cliente ficticio'},
            'quotation': quote,
            'contract': dict(quote, sha256='b' * 64, quotation_sha256=quote['sha256'],
                             event_id='TEST-EVENT', event_date='2027-03-12')}


def book():
    return {'sha256': 'f' * 64, 'cells': {}, 'markers': [(9, 3), (15, 4), (69, 12)],
            'hidden': [], 'links': [], 'merges': [], 'objects': False}


class PlannerTests(unittest.TestCase):
    def setUp(self):
        self.book, self.req = book(), request()

    def blocked(self, reason):
        with self.assertRaisesRegex(mod.Blocked, '^' + reason + '$'):
            mod.propose(self.book, self.req)

    def test_exact_proposal_preserves_cents_ids_and_inputs(self):
        original = copy.deepcopy((self.book, self.req))
        out = mod.propose(self.book, self.req)
        self.assertFalse(out['writable'])
        self.assertEqual(out['proposed_cells']['H']['amount_cents'], 121099)
        self.assertEqual(out['proposed_cells']['C'], '00926')
        self.assertEqual(out['identity']['revision'], 2)
        self.assertEqual((self.book, self.req), original)
        self.assertTrue(set('IJKLMNOPQ').isdisjoint(out['proposed_cells']))

    def test_repeat_is_deterministic_but_not_a_write_receipt(self):
        a = mod.propose(self.book, self.req)
        self.assertEqual(a, mod.propose(self.book, self.req))
        self.assertEqual(a['status'], 'pending_review')
        self.req['contract']['sha256'] = 'c' * 64
        self.assertNotEqual(a['proposal_id'], mod.propose(self.book, self.req)['proposal_id'])

    def test_rejects_real_inputs_and_changed_workbook(self):
        for field in ('test_mode',):
            self.req[field] = False
            self.blocked('FICTIONAL_ONLY')
        self.req['test_mode'] = True
        self.req['event']['is_test'] = False
        self.blocked('FICTIONAL_ONLY')
        self.req['event']['is_test'] = True
        self.req['workbook_sha256'] = 'e' * 64
        self.blocked('WORKBOOK_CHANGED')

    def test_quote_contract_revision_number_key_and_amount_conflicts(self):
        for field, value in [('number', '00927'), ('key', 'OTHER'), ('revision', 3), ('total_cents', 121100)]:
            with self.subTest(field=field):
                self.req = request()
                self.req['contract'][field] = value
                self.blocked('CONTRACT_QUOTE_MISMATCH')

    def test_source_and_event_binding(self):
        self.req['contract']['quotation_sha256'] = 'c' * 64
        self.blocked('CONTRACT_SOURCE_MISMATCH')
        self.req = request()
        self.req['contract']['event_id'] = 'OTHER-EVENT'
        self.blocked('CONTRACT_EVENT_MISMATCH')

    def test_event_year_does_not_follow_quote_suffix(self):
        self.assertEqual(mod.propose(self.book, self.req)['proposed_cells']['D'], '2027-03-12')
        self.req['event']['date'] = '2026-03-12'
        self.blocked('EVENT_YEAR_MISMATCH')

    def test_missing_ambiguous_and_last_month(self):
        self.book['markers'] = [(9, 4)]
        self.blocked('MONTH_MISSING_OR_AMBIGUOUS')
        self.book['markers'] = [(5, 3), (9, 3), (15, 4)]
        self.blocked('MONTH_MISSING_OR_AMBIGUOUS')
        self.book['markers'] = [(9, 3)]
        self.blocked('LAST_MONTH_REQUIRES_AUDITED_BOUNDARY')

    def test_wrong_month_marker_and_boundary(self):
        for row in (8, 9, 15, 16, True):
            self.req['candidate_row'] = row
            self.blocked('ROW_OUTSIDE_MONTH')

    def test_formula_or_value_outside_main_columns_blocks_row(self):
        for cell in ({'value': '', 'formula': True}, {'value': '0', 'formula': False}):
            self.book['cells'] = {'V11': cell}
            self.blocked('ROW_OCCUPIED')

    def test_existing_number_and_zero_alias_require_reconciliation(self):
        self.book['cells'] = {'C10': {'value': '00926', 'formula': False}}
        self.blocked('EXISTING_NUMBER_REQUIRES_RECONCILIATION')
        self.book['cells']['C10']['value'] = '926'
        self.blocked('POTENTIAL_NUMBER_ALIAS_REQUIRES_RECONCILIATION')

    def test_link_merge_hidden_and_object(self):
        for field, value, code in [('links', ['C11'], 'ROW_HAS_LINK_OR_MERGE'),
                                   ('merges', ['A10:Q12'], 'ROW_HAS_LINK_OR_MERGE'),
                                   ('hidden', [11], 'ROW_HIDDEN'),
                                   ('objects', True, 'OBJECTS_REQUIRE_REVIEW')]:
            self.book = book()
            self.book[field] = value
            self.blocked(code)

    def test_invalid_amount_and_formula_injection(self):
        for amount in (True, 12.34, -1, '121099'):
            self.req = request()
            self.req['quotation']['total_cents'] = amount
            self.blocked('INVALID_AMOUNT')
        self.req = request()
        self.req['event']['place'] = '=HYPERLINK("private")'
        self.blocked('FORMULA_LIKE_TEXT')


class ReaderTests(unittest.TestCase):
    def test_reads_fixture_without_writing_or_exposing_private_values(self):
        # Minimal XML fixture, not an authored or delivered business workbook.
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / 'fixture.xlsx'
            headers = ''.join('<c r="' + chr(65+i) + '3" t="inlineStr"><is><t>' + escape(h) + '</t></is></c>'
                              for i, h in enumerate(mod.HEADERS))
            with zipfile.ZipFile(path, 'w') as z:
                z.writestr('xl/workbook.xml', '<workbook xmlns="'+mod.NS['m']+'" xmlns:r="'+mod.REL[1:].split('}')[0]+'"><sheets><sheet name="'+mod.SHEET+'" sheetId="1" r:id="rId1"/></sheets></workbook>')
                z.writestr('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
                z.writestr('xl/worksheets/sheet1.xml', '<worksheet xmlns="'+mod.NS['m']+'"><sheetData><row r="3">'+headers+'</row><row r="9"><c r="A9" t="inlineStr"><is><t>MARZO</t></is></c><c r="V9"><f>PRIVATE_FORMULA</f></c></row><row r="10"><c r="G10" t="inlineStr"><is><t>PRIVATE_CLIENT</t></is></c></row></sheetData><hyperlinks><hyperlink ref="C10" location="PRIVATE_LINK"/></hyperlinks></worksheet>')
            original = path.read_bytes()
            read = mod.read_book(path)
            summary = mod.inspect(read)
            self.assertEqual(summary['sha256'], hashlib.sha256(original).hexdigest())
            self.assertEqual(summary['formula_cells'], ['V9'])
            self.assertEqual(summary['hyperlink_count'], 1)
            self.assertNotIn('PRIVATE', str(summary))
            self.assertEqual(path.read_bytes(), original)
            cli = subprocess.run([sys.executable, str(SOURCE), str(path)], capture_output=True, text=True)
            self.assertEqual(cli.returncode, 0)
            self.assertNotIn('PRIVATE', cli.stdout + cli.stderr)
            self.assertEqual(path.read_bytes(), original)


if __name__ == '__main__':
    unittest.main()
