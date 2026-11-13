"""Offline, read-only XLSX reconciliation. No network, credentials or apply operation.

Proposals are fictitious and advisory; they do not prove commercial closure,
signature, payment or permission to write. Never upload private input/output.
"""
import argparse
import datetime as dt
import hashlib
import io
import json
from pathlib import Path
import posixpath
import re
import zipfile
import xml.etree.ElementTree as ET

NS = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
REL = '{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id'
SHEET = 'Fechas cerradas 2027 por fecha '
MONTHS = 'ENERO FEBRERO MARZO ABRIL MAYO JUNIO JULIO AGOSTO SEPTIEMBRE OCTUBRE NOVIEMBRE DICIEMBRE'.split()
HEADERS = ['MES', 'Nº', 'nº presup', 'FECHA', 'HORARIO', 'LUGAR',
           'WEDDING/CLIENTE', 'PRESUPUESTO', 'COBRADO RESERVA', 'IVA',
           'FECHA RESERVA', 'Cobro pendiente', 'ARTISTAS',
           'GASTOS ARTISTAS y DESPLAZAMIENTO', 'GASTOS GRABACION DE VIDEO',
           'COMISION WED.', 'COBRO TOTAL']


class Blocked(ValueError):
    pass


def require(condition, code):
    if not condition:
        raise Blocked(code)


def digest(value):
    return hashlib.sha256(json.dumps(value, sort_keys=True, ensure_ascii=False,
                                     separators=(',', ':')).encode()).hexdigest()


def clean_text(value):
    require(isinstance(value, str) and 0 < len(value) <= 500, 'INVALID_TEXT')
    require(value == value.strip() and not re.search(r'[\x00-\x1f]', value), 'INVALID_TEXT')
    require(not value.startswith(('=', '+', '-', '@')), 'FORMULA_LIKE_TEXT')
    return value


def read_book(path):
    raw = path if isinstance(path, bytes) else Path(path).read_bytes()
    require(len(raw) <= 20_000_000, 'WORKBOOK_TOO_LARGE')
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        names = z.namelist()
        require(len(names) == len(set(names)), 'DUPLICATE_ZIP_ENTRY')
        require(sum(x.file_size for x in z.infolist()) <= 80_000_000, 'WORKBOOK_TOO_LARGE')

        def xml(name):
            data = z.read(name)
            require(b'<!DOCTYPE' not in data.upper() and b'<!ENTITY' not in data.upper(), 'UNSUPPORTED_XML')
            return ET.fromstring(data)

        wb = xml('xl/workbook.xml')
        require(wb.find('m:workbookPr', NS) is None or
                wb.find('m:workbookPr', NS).get('date1904', '0') not in ('1', 'true'), 'DATE_SYSTEM_UNSUPPORTED')
        rels = {r.get('Id'): r.get('Target') for r in xml('xl/_rels/workbook.xml.rels')}
        sheets = [s for s in wb.find('m:sheets', NS) if s.get('name') == SHEET]
        require(len(sheets) == 1, 'SHEET_MISSING_OR_AMBIGUOUS')
        target = rels[sheets[0].get(REL)]
        require('..' not in target and not target.startswith(('http:', 'https:')), 'INVALID_SHEET_PATH')
        sheet_path = target.lstrip('/') if target.startswith('/') else 'xl/' + target
        root = xml(sheet_path)
        strings = [''.join(x.itertext()) for x in xml('xl/sharedStrings.xml').findall('m:si', NS)] if 'xl/sharedStrings.xml' in names else []
        cells = {}
        formula_ranges = []
        for c in root.findall('m:sheetData/m:row/m:c', NS):
            v, inline = c.find('m:v', NS), c.find('m:is', NS)
            value = v.text if v is not None else ''
            if c.get('t') == 's':
                value = strings[int(value)]
            elif inline is not None:
                value = ''.join(inline.itertext())
            formula = c.find('m:f', NS)
            if formula is not None and formula.get('ref') is not None:
                ref = formula.get('ref')
                require(re.fullmatch(r'[A-Z]{1,3}[1-9][0-9]*(?::[A-Z]{1,3}[1-9][0-9]*)?', ref),
                        'INVALID_FORMULA_RANGE')
                formula_ranges.append(ref)
            require(c.get('r') not in cells, 'DUPLICATE_CELL')
            cells[c.get('r')] = {'value': value, 'formula': formula is not None}
        for i, expected in enumerate(HEADERS):
            actual = cells.get(chr(65 + i) + '3', {}).get('value', '')
            require(' '.join(actual.split()) == expected, 'HEADER_CHANGED')
        markers = [(int(ref[1:]), MONTHS.index(c['value']) + 1)
                   for ref, c in cells.items() if re.fullmatch(r'A\d+', ref) and c['value'] in MONTHS]
        links = [h.get('ref') for h in root.findall('m:hyperlinks/m:hyperlink', NS)]
        merges = [m.get('ref') for m in root.findall('m:mergeCells/m:mergeCell', NS)]
        hidden = [int(r.get('r')) for r in root.findall('m:sheetData/m:row', NS) if r.get('hidden') in ('1', 'true')]
        # Object/comment anchors need a dedicated audit before considering rows safe.
        objects = any('/comments' in n.lower() or '/threadedcomments/' in n.lower() for n in names) or any(
            root.find('m:' + tag, NS) is not None for tag in ('legacyDrawing', 'tableParts'))
        drawing = root.find('m:drawing', NS)
        if drawing is not None:
            rel_path = posixpath.dirname(sheet_path) + '/_rels/' + posixpath.basename(sheet_path) + '.rels'
            drawing_rels = [r for r in xml(rel_path) if r.get('Id') == drawing.get(REL)] if rel_path in names else []
            if len(drawing_rels) != 1 or drawing_rels[0].get('TargetMode') == 'External':
                objects = True
            else:
                drawing_target = drawing_rels[0].get('Target', '')
                drawing_path = posixpath.normpath(posixpath.join(posixpath.dirname(sheet_path), drawing_target))
                require(drawing_path.startswith('xl/') and drawing_path in names, 'INVALID_DRAWING_PATH')
                # Google Office exports may contain an empty drawing relationship.
                # Nonempty drawings remain blocked until their anchors are audited.
                objects = objects or len(xml(drawing_path)) > 0
    return {'sha256': hashlib.sha256(raw).hexdigest(), 'cells': cells,
            'markers': sorted(markers), 'links': links, 'merges': merges,
            'hidden': hidden, 'objects': objects, 'formula_ranges': formula_ranges}


def inspect(book):
    """Structural summary only: no customer data, amounts, URLs or raw formulas."""
    return {'read_only': True, 'sha256': book['sha256'], 'sheet': SHEET,
            'months_present': [MONTHS[m - 1] for _, m in book['markers']],
            'formula_cells': sorted(ref for ref, c in book['cells'].items() if c['formula']),
            'hyperlink_count': len(book['links']), 'objects_require_review': book['objects']}


def intersects_row(ref, row):
    parts = ref.split(':')
    bounds = [int(re.search(r'\d+$', p).group()) for p in parts]
    return min(bounds) <= row <= max(bounds)


def propose(book, request):
    require(request.get('test_mode') is True, 'FICTIONAL_ONLY')
    require(request.get('workbook_sha256') == book['sha256'], 'WORKBOOK_CHANGED')
    require(not book['objects'], 'OBJECTS_REQUIRE_REVIEW')
    event = request['event']
    require(event.get('is_test') is True, 'FICTIONAL_ONLY')
    event_id = clean_text(event['id'])
    date = dt.date.fromisoformat(event['date'])
    require(date.isoformat() == event['date'] and date.year == 2027, 'EVENT_YEAR_MISMATCH')
    quote, contract = request['quotation'], request['contract']
    for item in (quote, contract):
        for field in ('number', 'key'):
            clean_text(item[field])
        require(type(item['revision']) is int and item['revision'] > 0, 'INVALID_REVISION')
        require(re.fullmatch('[a-f0-9]{64}', item['sha256']) is not None, 'INVALID_DIGEST')
        require(type(item['total_cents']) is int and 0 <= item['total_cents'] <= 10**12, 'INVALID_AMOUNT')
    require(all(quote[f] == contract[f] for f in ('number', 'key', 'revision', 'total_cents')), 'CONTRACT_QUOTE_MISMATCH')
    require(contract.get('quotation_sha256') == quote['sha256'], 'CONTRACT_SOURCE_MISMATCH')
    require(contract.get('event_id') == event_id and contract.get('event_date') == event['date'], 'CONTRACT_EVENT_MISMATCH')
    require(request.get('currency') == 'EUR', 'CURRENCY_UNSUPPORTED')
    # A manual number lacks key/revision: even a unique match must be reconciled.
    existing = [ref for ref, c in book['cells'].items()
                if re.fullmatch(r'C\d+', ref) and c['value'] == quote['number']]
    require(not existing, 'EXISTING_NUMBER_REQUIRES_RECONCILIATION')
    if quote['number'].isdigit():
        aliases = [c for ref, c in book['cells'].items() if re.fullmatch(r'C\d+', ref)
                   and str(c['value']).isdigit()
                   and str(c['value']).lstrip('0') == quote['number'].lstrip('0')]
        require(not aliases, 'POTENTIAL_NUMBER_ALIAS_REQUIRES_RECONCILIATION')
    # Cached formula results cannot establish stable monthly boundaries.
    require(not any(book['cells'].get(f'A{r}', {}).get('formula') for r, _ in book['markers']),
            'CALCULATED_MONTH_MARKER')
    starts = [(r, m) for r, m in book['markers'] if m == date.month]
    require(len(starts) == 1, 'MONTH_MISSING_OR_AMBIGUOUS')
    start = starts[0][0]
    following = [r for r, _ in book['markers'] if r > start]
    # Last section has no safe inferred boundary (totals may follow).
    require(bool(following), 'LAST_MONTH_REQUIRES_AUDITED_BOUNDARY')
    row = request['candidate_row']
    require(type(row) is int and start < row < min(following), 'ROW_OUTSIDE_MONTH')
    require(row not in book['hidden'], 'ROW_HIDDEN')
    require(not any(intersects_row(r, row) for r in book['merges'] + book['links']), 'ROW_HAS_LINK_OR_MERGE')
    # A range formula may cover a blank row even when its anchor is elsewhere.
    require(not any(intersects_row(ref, row) for ref in book.get('formula_ranges', ())),
            'ROW_HAS_FORMULA_RANGE')
    # Check all columns, including formulas outside A:Q and cached-empty formulas.
    require(not any(int(re.search(r'\d+$', ref).group()) == row and
                    (c['formula'] or c['value'] not in ('', None))
                    for ref, c in book['cells'].items()), 'ROW_OCCUPIED')
    proposed = {'C': quote['number'], 'D': date.isoformat(),
                'E': clean_text(event['schedule']), 'F': clean_text(event['place']),
                'G': clean_text(event['client']), 'H': {'amount_cents': quote['total_cents'], 'currency': 'EUR'}}
    identity = {'event_id': event_id, 'number': quote['number'], 'key': quote['key'],
                'revision': quote['revision'], 'quotation_sha256': quote['sha256'],
                'contract_sha256': contract['sha256']}
    result = {'mode': 'dry_run', 'writable': False, 'status': 'pending_review',
              'workbook_sha256': book['sha256'], 'sheet': SHEET, 'candidate_row': row,
              'identity': identity, 'proposed_cells': proposed,
              'untouched_columns': ['A', 'B', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q'],
              'pending': ['commercial_closure_rules', 'row_style_and_separator_review',
                          'tax_column_semantics', 'xlsx_writer_and_atomic_commit',
                          'private_link_and_operation_ledger']}
    result['proposal_id'] = digest(result)
    return result


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('workbook')
    parser.add_argument('--request', help='Private JSON with fictitious data only; never commit it.')
    args = parser.parse_args()
    try:
        book = read_book(args.workbook)
        result = propose(book, json.loads(Path(args.request).read_text())) if args.request else inspect(book)
        print(json.dumps(result, ensure_ascii=False, indent=2))
    except (Blocked, KeyError, ValueError, TypeError, AttributeError, OSError, zipfile.BadZipFile, ET.ParseError, IndexError) as exc:
        code = str(exc) if isinstance(exc, Blocked) else 'INVALID_INPUT'
        print(json.dumps({'mode': 'dry_run', 'writable': False, 'status': 'blocked', 'reason': code}))
        raise SystemExit(2)


if __name__ == '__main__':
    main()
