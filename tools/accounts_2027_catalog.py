"""Read-only private catalog from the 2027 XLSX. Never commit emitted records."""
import datetime as dt
from decimal import Decimal, InvalidOperation
import json
from pathlib import Path
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

from accounts_2027 import read_book, NS, REL, SHEET, HEADERS, require


def catalog(path):
    book = read_book(path)
    with zipfile.ZipFile(path) as z:
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read('xl/_rels/workbook.xml.rels'))}
        sheet = next(s for s in wb.find('m:sheets', NS) if s.get('name') == SHEET)
        target = rels[sheet.get(REL)]
        part = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        root = ET.fromstring(z.read(part))
        cell_types = {c.get('r'): c.get('t', 'n') for c in root.findall('m:sheetData/m:row/m:c', NS)}
        rel_part = part.rsplit('/', 1)[0] + '/_rels/' + part.rsplit('/', 1)[1] + '.rels'
        links = {r.get('Id'): r.get('Target') for r in ET.fromstring(z.read(rel_part))} if rel_part in z.namelist() else {}
        hyperlink = {h.get('ref'): links.get(h.get(REL)) for h in root.findall('m:hyperlinks/m:hyperlink', NS)}
        sheet_id = sheet.get('sheetId')
    rows, skipped = [], 0
    for row in sorted({int(ref[1:]) for ref in book['cells'] if re.fullmatch(r'D\d+', ref)}):
        if row <= 3:
            continue
        def value(col):
            return book['cells'].get(col + str(row), {}).get('value')
        raw_date = value('D')
        if raw_date in ('', None):
            continue
        if ' '.join(str(raw_date).split()) == 'FECHA':
            continue  # Repeated header inside the second half of the sheet.
        try:
            date = (dt.date(1899, 12, 30) + dt.timedelta(days=int(Decimal(raw_date)))) if re.fullmatch(r'\d+(?:\.0+)?', raw_date) else dt.datetime.strptime(raw_date, '%d/%m/%Y').date()
        except (ValueError, InvalidOperation, OverflowError):
            skipped += 1
            continue
        if date.year != 2027:
            skipped += 1
            continue
        values = {label: value(chr(65+i)) for i, label in enumerate(HEADERS)}
        number = str(value('C') or '')
        if cell_types.get('C'+str(row)) == 'n' and re.fullmatch(r'\d+(?:\.0+)?', number):
            number = str(int(Decimal(number)))
            values['nº presup'] = number
        budget = value('H')
        try:
            decimal = Decimal(budget)
            require(decimal.is_finite(), 'INVALID_AMOUNT')
            budget_eur = str(decimal) if decimal*100 == (decimal*100).to_integral_value() else None
        except (InvalidOperation, TypeError):
            budget_eur = None
        rows.append({'source_row': row, 'event_date': date.isoformat(), 'schedule': value('E'),
                     'venue': value('F'), 'client_label': value('G'), 'quote_number': number,
                     'budget_eur': budget_eur, 'budget_text': budget, 'account_values': values,
                     'source_link': hyperlink.get('C'+str(row)), 'contract_url': None})
    return {'year': 2027, 'source_sha256': book['sha256'], 'source_sheet': SHEET,
            'source_sheet_id': sheet_id, 'rows': rows, 'skipped_date_rows': skipped}


if __name__ == '__main__':
    print(json.dumps(catalog(Path(sys.argv[1])), ensure_ascii=False))
