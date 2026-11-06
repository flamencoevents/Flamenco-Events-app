"""Read-only projection of native Sheets CellData; never edits the source.

Preserves every nonempty cell, its typed/formula/display values and links.
Only dated rows in the exact 2025/2026 event tabs enter the event catalog.
Other rows remain available in the complete sheet snapshot, without guessing.
"""
import datetime as dt
from decimal import Decimal
import hashlib
import json


def sha(value):
    return hashlib.sha256(json.dumps(value, ensure_ascii=False, sort_keys=True,
                                     separators=(',', ':'), allow_nan=False).encode()).hexdigest()


def column(index):
    result = ''
    while index:
        index, remainder = divmod(index - 1, 26)
        result = chr(65 + remainder) + result
    return result


def display(cell):
    if 'formattedValue' in cell:
        return cell['formattedValue']
    value = cell.get('effectiveValue', cell.get('userEnteredValue', {}))
    for kind in ('stringValue', 'numberValue', 'boolValue'):
        if kind in value:
            return str(value[kind])
    return ''


def date_value(cell):
    value = cell.get('effectiveValue', {})
    if type(value.get('numberValue')) in (int, float):
        serial = Decimal(str(value['numberValue']))
        if serial != serial.to_integral_value():
            return None
        return (dt.date(1899, 12, 30) + dt.timedelta(days=int(serial))).isoformat()
    # No interpretation of a textual two-digit year.
    for pattern in ('%d/%m/%Y', '%Y-%m-%d'):
        try:
            return dt.datetime.strptime(display(cell), pattern).date().isoformat()
        except ValueError:
            pass
    return None


def amount(cell):
    value = cell.get('effectiveValue', {}).get('numberValue')
    if type(value) not in (int, float):
        return None
    number = Decimal(str(value))
    return str(number) if number.is_finite() and number * 100 == (number * 100).to_integral_value() else None


def project(source):
    snapshots, years, events, issues = [], [], [], []
    source_digest = sha(source)
    for sheet in source['sheets']:
        props = sheet['properties']
        rows = {}
        for block in sheet.get('data', []):
            for offset, row in enumerate(block.get('rowData', [])):
                row_num = block.get('startRow', 0) + offset + 1
                cells = rows.setdefault(row_num, {})
                for index, cell in enumerate(row.get('values', [])):
                    if cell:
                        col_num = block.get('startColumn', 0) + index + 1
                        if col_num in cells:
                            raise ValueError('OVERLAPPING_SOURCE_RANGES')
                        cells[col_num] = cell
        records = [{'row': n, 'cells': [{'column': column(c), 'data': value}
                    for c, value in sorted(cells.items())]}
                   for n, cells in sorted(rows.items()) if cells]
        snapshots.append({'source_key': 'accounts-2025-2026', 'sheet_id': props['sheetId'],
                          'sheet_title': props['title'], 'sheet_index': props['index'],
                          'source_url': source['source_url'].split('#')[0] + '#gid=' + str(props['sheetId']),
                          'source_modified_at': source['source_modified_at'],
                          'source_sha256': sha(sheet), 'cells': records})
        matches = {f'Fechas cerradas {y} por fecha de ev': y for y in (2025, 2026)}
        year = matches.get(props['title'])
        if not year:
            continue
        years.append({'year': year, 'source_url': snapshots[-1]['source_url'],
                      'source_title': source['source_title'], 'source_sha256': source_digest,
                      'source_modified_at': source['source_modified_at']})
        headers = rows.get(3, {})
        for n, cells in sorted(rows.items()):
            if n <= 3:
                continue
            day = date_value(cells.get(4, {}))
            if not day:
                continue
            if int(day[:4]) != year:
                issues.append({'sheet_id': props['sheetId'], 'row': n, 'reason': 'DATE_OUTSIDE_SHEET_YEAR',
                               'event_date': day})
                continue
            value = lambda c: display(cells.get(c, {})) or None
            reference_column = 2 if year == 2025 else 3
            labels = []
            for c in sorted(set(headers) | set(cells)):
                if c in headers or c in cells:
                    cell = cells.get(c, {})
                    labels.append({'column': column(c), 'label': display(headers.get(c, {})) or 'Columna ' + column(c),
                                   'value': display(cell), 'formula': cell.get('userEnteredValue', {}).get('formulaValue'),
                                   'note': cell.get('note'), 'hyperlink': cell.get('hyperlink')})
            account_values = {'__source_fields': labels, '__source_sheet': props['title']}
            # Preserve meaning: TOTAL CASA is never relabelled COBRO TOTAL.
            account_values['PRESUPUESTO'] = value(8)
            account_values['COBRADO RESERVA'] = value(9)
            if year == 2026:
                account_values['COBRO TOTAL'] = value(18)
            note = 'Histórico del libro. Documentos sin clasificar; no acredita firma ni cobro.'
            if year == 2025:
                note += ' La hoja no contiene una columna de horario.'
            source_link = cells.get(reference_column, {}).get('hyperlink')
            # Keep arbitrary original links in the snapshot; only supported
            # safe domains are eligible for the existing link column.
            if source_link and not source_link.startswith(('https://canva.link/', 'https://www.canva.com/design/',
                                                          'https://drive.google.com/file/d/')):
                source_link = None
            client = value(7)
            if year == 2025 and value(6):
                client = 'Wedding: ' + value(6) + (' · Cliente: ' + client if client else '')
            events.append({'year': year, 'source_row': n, 'event_date': day,
                           'schedule': value(5) if year == 2026 else None,
                           'venue': value(6 if year == 2026 else 5), 'client_label': client,
                           'quote_number': value(reference_column), 'budget_eur': amount(cells.get(8, {})),
                           'budget_text': value(8), 'account_values': account_values,
                           'source_link': source_link, 'quotation_url': None, 'contract_url': None,
                           'document_note': note})
    if len(snapshots) != len(source['sheets']) or {y['year'] for y in years} != {2025, 2026}:
        raise ValueError('INCOMPLETE_HISTORY_SOURCE')
    return {'years': years, 'events': events, 'snapshots': snapshots, 'issues': issues,
            'source_sha256': source_digest}


if __name__ == '__main__':
    import sys
    with open(sys.argv[1]) as f:
        result = project(json.load(f))
    print(json.dumps(result, ensure_ascii=False, allow_nan=False))
