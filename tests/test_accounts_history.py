"""Synthetic native CellData projection; no business files or services."""
import copy
from pathlib import Path
import sys
import unittest
sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from accounts_history import project, sha


def cell(value, display=None):
    kind = 'numberValue' if type(value) in (int, float) else 'stringValue'
    result = {'effectiveValue': {kind: value}, 'userEnteredValue': {kind: value}}
    if display is not None:
        result['formattedValue'] = display
    return result


def fixture():
    sheets = []
    for index, year in enumerate((2025, 2026)):
        header = [cell('Campo ' + str(i)) for i in range(19)]
        row = [{} for _ in range(19)]
        row[1], row[2], row[3] = cell('00925'), cell('00726'), cell('12/03/' + str(year))
        row[4], row[5], row[6] = cell('Lugar o horario'), cell('Wedding o lugar'), cell('Cliente ficticio')
        row[7], row[8] = cell(0, '0,00 €'), cell(0, '0,00 €')
        row[17], row[18] = cell(42, '42,00 €'), cell(99, '99,00 €')
        row[17]['userEnteredValue'] = {'formulaValue': '=H4-I4'}
        row[17]['note'] = '<nota>'
        sheets.append({'properties': {'sheetId': year, 'title': f'Fechas cerradas {year} por fecha de ev',
                                     'index': index},
                       'data': [{'rowData': [{}, {}, {'values': header}, {'values': row}]}]})
    return {'source_url': 'https://docs.google.com/spreadsheets/d/FICTICIO/edit',
            'source_title': 'Libro ficticio', 'source_modified_at': '2026-11-06T00:00:00Z', 'sheets': sheets}


class HistoryTests(unittest.TestCase):
    def test_different_columns_and_exact_reference(self):
        out = project(fixture())
        a, b = out['events']
        self.assertEqual(a['quote_number'], '00925')
        self.assertIsNone(a['schedule'])
        self.assertEqual(a['venue'], 'Lugar o horario')
        self.assertEqual(b['quote_number'], '00726')
        self.assertEqual(b['schedule'], 'Lugar o horario')
        self.assertEqual(b['venue'], 'Wedding o lugar')

    def test_zero_and_totals_keep_original_meaning(self):
        a, b = project(fixture())['events']
        self.assertEqual(a['budget_eur'], '0')
        self.assertNotIn('COBRO TOTAL', a['account_values'])
        self.assertEqual(b['account_values']['COBRO TOTAL'], '42,00 €')
        self.assertEqual(b['account_values']['__source_fields'][18]['value'], '99,00 €')

    def test_full_snapshot_keeps_formulas_links_notes_and_extra_sheets(self):
        source = fixture()
        source['sheets'][0]['data'][0]['rowData'][3]['values'][0] = {'note': 'sin valor'}
        extra = {'properties': {'sheetId': 9, 'title': 'IVA', 'index': 2},
                 'data': [{'rowData': [{'values': [{'note': 'NOTA', 'hyperlink': 'https://example.invalid/'}]}]}]}
        source['sheets'].append(extra)
        before = copy.deepcopy(source)
        result = project(source)
        self.assertEqual(len(result['snapshots']), 3)
        self.assertEqual(result['snapshots'][2]['cells'][0]['cells'][0]['data'], extra['data'][0]['rowData'][0]['values'][0])
        self.assertEqual(source, before)
        self.assertEqual(result['source_sha256'], sha(source))

    def test_wrong_year_stays_in_snapshot_without_false_event(self):
        source = fixture()
        source['sheets'][0]['data'][0]['rowData'][3]['values'][3] = cell('29/11/2024')
        out = project(source)
        self.assertEqual(len(out['events']), 1)
        self.assertEqual(out['issues'][0]['reason'], 'DATE_OUTSIDE_SHEET_YEAR')
        self.assertEqual(out['snapshots'][0]['cells'][1]['row'], 4)

    def test_unknown_budget_is_preserved_without_guessing(self):
        source = fixture()
        source['sheets'][0]['data'][0]['rowData'][3]['values'][7] = cell('????')
        out = project(source)['events'][0]
        self.assertIsNone(out['budget_eur'])
        self.assertEqual(out['budget_text'], '????')

    def test_duplicated_references_keep_distinct_source_rows(self):
        source = fixture()
        rows = source['sheets'][0]['data'][0]['rowData']
        rows.append(copy.deepcopy(rows[3]))
        events = [e for e in project(source)['events'] if e['year'] == 2025]
        self.assertEqual([e['source_row'] for e in events], [4, 5])
        self.assertEqual(events[0]['quote_number'], events[1]['quote_number'])


if __name__ == '__main__':
    unittest.main()
