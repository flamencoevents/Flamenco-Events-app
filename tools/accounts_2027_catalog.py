"""Read-only private catalog from the 2027 XLSX. Never commit emitted records."""
from collections import defaultdict
import datetime as dt
from decimal import Decimal, InvalidOperation
import io
import json
from pathlib import Path
import re
import sys
import zipfile
import xml.etree.ElementTree as ET

from accounts_2027 import (HEADERS, NS, REL, SHEET, read_book, read_workbook_bytes,
                           workbook_relationships, worksheet_part)


def exact_budget(value):
    try:
        amount = Decimal(value)
    except (InvalidOperation, TypeError):
        return None
    if not amount.is_finite():
        return None
    _, digits, exponent = amount.as_tuple()
    # Inspect the saved digits directly to avoid decimal-context rounding.
    if exponent < -2 and any(digits[exponent + 2:]):
        return None
    return str(amount)


def quotation_links(archive, worksheet, part):
    folder, filename = part.rsplit('/', 1)
    rel_part = f'{folder}/_rels/{filename}.rels'
    if rel_part not in archive.namelist():
        return {}

    relationships = defaultdict(list)
    for relationship in ET.fromstring(archive.read(rel_part)):
        relationships[relationship.get('Id')].append(relationship)

    anchors = defaultdict(list)
    for link in worksheet.findall('m:hyperlinks/m:hyperlink', NS):
        ref = link.get('ref') or ''
        if re.fullmatch(r'C[1-9][0-9]*', ref):
            anchors[ref].append(link.get(REL))

    targets = {}
    expected_type = REL[1:].split('}', 1)[0] + '/hyperlink'
    for ref, ids in anchors.items():
        if len(ids) != 1 or not ids[0]:
            continue
        matches = relationships.get(ids[0], ())
        if len(matches) == 1:
            relationship = matches[0]
            if relationship.get('Type') == expected_type and relationship.get('TargetMode') == 'External':
                targets[ref] = relationship.get('Target') or None
    return targets


def catalog(path):
    raw = read_workbook_bytes(path)
    book = read_book(raw)
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        wb = ET.fromstring(z.read('xl/workbook.xml'))
        rels = workbook_relationships(ET.fromstring(z.read('xl/_rels/workbook.xml.rels')))
        sheet = next(s for s in wb.find('m:sheets', NS) if s.get('name') == SHEET)
        part = worksheet_part(rels, sheet, z.namelist())
        root = ET.fromstring(z.read(part))
        hyperlink = quotation_links(z, root, part)
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
        if book['cells'].get('C'+str(row), {}).get('kind') == 'n' and re.fullmatch(r'\d+(?:\.0+)?', number):
            number = str(int(Decimal(number)))
            values['nº presup'] = number
        budget = value('H')
        budget_eur = exact_budget(budget)
        rows.append({'source_row': row, 'event_date': date.isoformat(), 'schedule': value('E'),
                     'venue': value('F'), 'client_label': value('G'), 'quote_number': number,
                     'budget_eur': budget_eur, 'budget_text': budget, 'account_values': values,
                     'source_link': hyperlink.get('C'+str(row)), 'contract_url': None})
    return {'year': 2027, 'source_sha256': book['sha256'], 'source_sheet': SHEET,
            'source_sheet_id': sheet_id, 'rows': rows, 'skipped_date_rows': skipped}


if __name__ == '__main__':
    print(json.dumps(catalog(Path(sys.argv[1])), ensure_ascii=False))
