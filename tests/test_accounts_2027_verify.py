"""Independent preservation checks with synthetic semantic snapshots only."""
import copy
import datetime as dt
from decimal import Decimal
import sys
from pathlib import Path
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import accounts_2027_verify as audit
from test_accounts_2027 import book, request, mod


def cell(kind, value, style='1'):
    return {'kind': kind, 'value': value, 'style': style, 'formula': None, 'attributes': {}}


class PreservationTests(unittest.TestCase):
    def setUp(self):
        self.proposal = mod.propose(book(), request())
        cells = {c + '11': cell('n', '') for c in 'CDEFGH'}
        cells['Q73'] = dict(cell('formula', None), formula=('formula', 'KEEP_PRIVATE'))
        cells['G10'] = cell('text', 'PRIVATE_CLIENT')
        self.source = {'protected': {'styles': 'SAME', 'links': 'PRIVATE_LINK', 'workbook': 'SAME'},
                       'sheets': {audit.SHEET: {'structure': 'SAME', 'cells': cells},
                                  'Other': {'structure': 'KEEP', 'cells': {'H3': cell('n', '123')}}}}
        self.candidate = copy.deepcopy(self.source)
        dest = self.candidate['sheets'][audit.SHEET]['cells']
        values = self.proposal['proposed_cells']
        for c in 'CEFG':
            dest[c + '11'] = cell('text', values[c])
        dest['D11'] = cell('n', str(Decimal((dt.date(2027, 3, 12) - dt.date(1899, 12, 30)).days).normalize()))
        dest['H11'] = cell('n', str(Decimal('1210.99').normalize()))

    def result(self):
        return audit.compare(self.source, self.candidate, self.proposal)

    def reasons(self):
        result = self.result()
        self.assertEqual(result['status'], 'blocked')
        self.assertFalse(result['production_writable'])
        self.assertNotIn('PRIVATE', str(result))
        return [d['reason'] for d in result['differences']]

    def test_expected_copy_values_pass_without_production_permission(self):
        before = copy.deepcopy((self.source, self.candidate))
        result = self.result()
        self.assertEqual(result['status'], 'copy_preservation_checks_passed')
        self.assertFalse(result['production_writable'])
        self.assertEqual((self.source, self.candidate), before)

    def test_unrelated_value_and_other_sheet_changes_fail(self):
        self.candidate['sheets']['Other']['cells']['H3']['value'] = '124'
        self.assertIn('UNRELATED_CELLS_CHANGED', self.reasons())

    def test_unrelated_precise_numeric_change_fails(self):
        def record(value):
            c = audit.ET.fromstring('<c xmlns="' + audit.NS['m'] + '"><v>' + value + '</v></c>')
            return audit.cell_record(c, [])
        left = '0.12345678901234567890123456781'
        right = '0.12345678901234567890123456782'
        self.assertEqual(record(left), record(left + '0'))
        self.source['sheets']['Other']['cells']['H3'] = record(left)
        self.candidate['sheets']['Other']['cells']['H3'] = record(right)
        self.assertIn('UNRELATED_CELLS_CHANGED', self.reasons())

    def test_formula_change_fails(self):
        self.candidate['sheets'][audit.SHEET]['cells']['Q73']['formula'] = ('formula', 'CHANGED')
        self.assertIn('UNRELATED_CELLS_CHANGED', self.reasons())

    def test_protected_styles_links_or_workbook_change_fails(self):
        for field in ('styles', 'links', 'workbook'):
            with self.subTest(field=field):
                old = self.candidate['protected'][field]
                self.candidate['protected'][field] = 'CHANGED'
                self.assertIn('PROTECTED_PARTS_CHANGED', self.reasons())
                self.candidate['protected'][field] = old

    def test_sheet_rename_and_row_structure_fail(self):
        self.candidate['sheets'][audit.SHEET]['structure'] = 'CHANGED'
        self.assertIn('SHEET_STRUCTURE_CHANGED', self.reasons())
        self.candidate['sheets']['RENAMED'] = self.candidate['sheets'].pop('Other')
        self.assertIn('SHEET_SET_CHANGED', self.reasons())

    def test_missing_target_does_not_pass(self):
        del self.candidate['sheets'][audit.SHEET]['cells']['C11']
        self.assertIn('PROPOSED_VALUE_MISMATCH', self.reasons())
        del self.source['sheets'][audit.SHEET]['cells']['C11']
        self.assertIn('PROPOSED_VALUE_MISSING', self.reasons())

    def test_wrong_cent_date_or_identifier_type_fails(self):
        dest = self.candidate['sheets'][audit.SHEET]['cells']
        for ref, key, value in [('H11', 'value', '1211'), ('D11', 'value', '123'), ('C11', 'kind', 'n')]:
            with self.subTest(ref=ref):
                old = dest[ref][key]
                dest[ref][key] = value
                self.assertIn('PROPOSED_VALUE_MISMATCH', self.reasons())
                dest[ref][key] = old

    def test_target_style_or_formula_cannot_be_overwritten(self):
        dest = self.candidate['sheets'][audit.SHEET]['cells']['H11']
        dest['style'] = '2'
        self.assertIn('TARGET_FORMAT_CHANGED', self.reasons())
        dest['formula'] = ('FORMULA',)
        self.assertIn('PROPOSED_VALUE_MISMATCH', self.reasons())


if __name__ == '__main__':
    unittest.main()
