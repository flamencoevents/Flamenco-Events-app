"""Strict local COPY audit. Read-only; never authorizes production replacement.

Unexplained changes fail closed, even when a spreadsheet editor might consider
them equivalent. Raw workbook values/formulas/links are never in the report.
"""
import argparse
import copy
import datetime as dt
from decimal import Decimal, localcontext
import hashlib
import io
import json
from pathlib import Path
import posixpath
import re
import zipfile
import xml.etree.ElementTree as ET

from accounts_2027 import NS, REL, SHEET, Blocked, propose, read_book, require


def xml_signature(element):
    # Namespace prefixes and indentation are irrelevant; values are not trimmed.
    return (element.tag, tuple(sorted(element.attrib.items())),
            element.text if element.text and element.text.strip() else None,
            tuple(xml_signature(child) for child in element))


def cell_record(cell, strings):
    values = cell.findall('m:v', NS)
    inline_values = cell.findall('m:is', NS)
    formulas = cell.findall('m:f', NS)
    require(len(values) + len(inline_values) <= 1 and len(formulas) <= 1,
            'AMBIGUOUS_CELL_PAYLOAD')
    value = values[0] if values else None
    inline = inline_values[0] if inline_values else None
    text = value.text if value is not None else ''
    kind = cell.get('t', 'n')
    if kind == 's':
        inline = strings[int(text)]
    if kind in ('s', 'inlineStr'):
        kind, text = 'text', ''.join(inline.itertext()) if inline is not None else ''
    elif kind == 'str':
        kind = 'text'
    elif kind == 'n' and text not in ('', None):
        number = Decimal(text)
        with localcontext() as context:
            context.prec = max(context.prec, len(number.as_tuple().digits))
            text = str(number.normalize())
    formula = formulas[0] if formulas else None
    # Formula cache recalculation is not counted as changing the formula itself.
    if formula is not None:
        text, kind = None, 'formula'
    record = {'kind': kind, 'value': text, 'style': cell.get('s', '0'),
            'formula': xml_signature(formula) if formula is not None else None,
            'attributes': {k: v for k, v in cell.attrib.items() if k not in ('r', 's', 't')}}
    if inline is not None and (len(inline) != 1 or inline[0].tag != '{' + NS['m'] + '}t'):
        record['rich_text'] = tuple(xml_signature(child) for child in inline)
    payload_tags = {f"{{{NS['m']}}}{tag}" for tag in ('v', 'is', 'f')}
    metadata = tuple(xml_signature(child) for child in cell if child.tag not in payload_tags)
    if metadata:
        record['metadata'] = metadata
    return record


def snapshot(path):
    # Reuse bounded ZIP/XML validation and exact header/name checks.
    raw = path if isinstance(path, bytes) else Path(path).read_bytes()
    read_book(raw)
    with zipfile.ZipFile(io.BytesIO(raw)) as z:
        parts = {name: z.read(name) for name in z.namelist()}
        def xml(raw):
            require(b'<!DOCTYPE' not in raw.upper() and b'<!ENTITY' not in raw.upper(), 'UNSUPPORTED_XML')
            return ET.fromstring(raw)
        wb = xml(parts['xl/workbook.xml'])
        rels = {r.get('Id'): r.get('Target') for r in xml(parts['xl/_rels/workbook.xml.rels'])}
        ss = xml(parts['xl/sharedStrings.xml']) if 'xl/sharedStrings.xml' in parts else []
        strings = list(ss)
        sheets = {}
        ignored = {'xl/sharedStrings.xml'}
        for sheet in wb.find('m:sheets', NS):
            target = rels[sheet.get(REL)]
            name = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
            root = xml(parts[name])
            ignored.add(name)
            cells = {}
            for row in root.findall('m:sheetData/m:row', NS):
                for cell in row.findall('m:c', NS):
                    ref = cell.get('r')
                    require(bool(ref), 'MISSING_CELL_REFERENCE')
                    match = re.fullmatch(r'[A-Z]{1,3}([1-9][0-9]*)', ref)
                    require(match is not None, 'INVALID_CELL_REFERENCE')
                    require(row.get('r') in (None, match[1]), 'CELL_ROW_MISMATCH')
                    require(ref not in cells, 'DUPLICATE_CELL')
                    cells[ref] = cell_record(cell, strings)
            structure = copy.deepcopy(root)
            for row in structure.findall('m:sheetData/m:row', NS):
                for cell in row.findall('m:c', NS):
                    row.remove(cell)
            sheets[sheet.get('name')] = {'cells': cells, 'structure': xml_signature(structure)}
        protected = {}
        for name, raw in parts.items():
            if name in ignored:
                continue
            protected[name] = xml_signature(xml(raw)) if name.endswith(('.xml', '.rels')) else hashlib.sha256(raw).hexdigest()
    return {'sheets': sheets, 'protected': protected}


def compare(source, candidate, proposal):
    changes = []
    if source['protected'] != candidate['protected']:
        names = set(source['protected']) | set(candidate['protected'])
        changes.append({'reason': 'PROTECTED_PARTS_CHANGED', 'count': sum(
            source['protected'].get(n) != candidate['protected'].get(n) for n in names)})
    if source['sheets'].keys() != candidate['sheets'].keys():
        changes.append({'reason': 'SHEET_SET_CHANGED'})
    row = proposal['candidate_row']
    cells = proposal['proposed_cells']
    expected = {c + str(row): {'kind': 'text', 'value': cells[c]} for c in ('C', 'E', 'F', 'G')}
    expected['D' + str(row)] = {'kind': 'n', 'value': str(Decimal((dt.date.fromisoformat(cells['D']) - dt.date(1899, 12, 30)).days).normalize())}
    expected['H' + str(row)] = {'kind': 'n', 'value': str((Decimal(cells['H']['amount_cents']) / 100).normalize())}
    for name in source['sheets'].keys() & candidate['sheets'].keys():
        before, after = source['sheets'][name], candidate['sheets'][name]
        if before['structure'] != after['structure']:
            changes.append({'reason': 'SHEET_STRUCTURE_CHANGED'})
        unintended = 0
        for ref in before['cells'].keys() | after['cells'].keys():
            left, right = before['cells'].get(ref), after['cells'].get(ref)
            if name == SHEET and ref in expected:
                wanted = expected[ref]
                if right is None or any(right.get(k) != v for k, v in wanted.items()) or (right.get('formula') is not None or 'rich_text' in right):
                    changes.append({'reason': 'PROPOSED_VALUE_MISMATCH', 'cell': ref})
                if right is not None and (right.get('style', '0') != (left or {}).get('style', '0') or
                                          right.get('attributes', {}) != (left or {}).get('attributes', {}) or
                                          right.get('metadata', ()) != (left or {}).get('metadata', ())):
                    changes.append({'reason': 'TARGET_FORMAT_CHANGED', 'cell': ref})
            elif left != right:
                unintended += 1
        # A missing target in both source and export also fails.
        if name == SHEET:
            for ref in expected.keys() - after['cells'].keys() - before['cells'].keys():
                changes.append({'reason': 'PROPOSED_VALUE_MISSING', 'cell': ref})
        if unintended:
            changes.append({'reason': 'UNRELATED_CELLS_CHANGED', 'count': unintended})
    return {'status': 'blocked' if changes else 'copy_preservation_checks_passed',
            'production_writable': False, 'differences': changes,
            'pending': ['visual_review', 'native_excel_recalculation', 'server_authorization', 'atomic_commit']}


def verify(source, candidate, request):
    require(Path(source).resolve() != Path(candidate).resolve(), 'SAME_FILE_REJECTED')
    source_raw = Path(source).read_bytes()
    candidate_raw = Path(candidate).read_bytes()
    proposal = propose(read_book(source_raw), request)
    result = compare(snapshot(source_raw), snapshot(candidate_raw), proposal)
    result['source_sha256'] = proposal['workbook_sha256']
    result['candidate_sha256'] = hashlib.sha256(candidate_raw).hexdigest()
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('source')
    p.add_argument('candidate')
    p.add_argument('request')
    args = p.parse_args()
    try:
        result = verify(args.source, args.candidate, json.loads(Path(args.request).read_text()))
    except (Blocked, KeyError, TypeError, ValueError, ArithmeticError, IndexError, OSError, zipfile.BadZipFile, ET.ParseError) as exc:
        result = {'status': 'blocked', 'production_writable': False,
                  'reason': str(exc) if isinstance(exc, Blocked) else 'INVALID_INPUT'}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(0 if result['status'] == 'copy_preservation_checks_passed' else 2)


if __name__ == '__main__':
    main()
