"""Preserve the source XLSX package around six Artifact-authored value cells.

No calculation, conversion, layout rebuilding, upload or source replacement.
Values must come from the Artifact Tool export and pass the independent audit.
Only fictitious, preformatted empty destinations are supported.
"""
import argparse
import copy
import hashlib
import io
import json
from pathlib import Path
import posixpath
import tempfile
import os
import zipfile
import xml.etree.ElementTree as ET
from xml.parsers import expat

from accounts_2027 import NS, REL, SHEET, Blocked, propose, read_book, require
from accounts_2027_verify import verify


def sheet_part(archive):
    wb = ET.fromstring(archive.read('xl/workbook.xml'))
    rels = {r.get('Id'): r for r in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
    sheets = [s for s in wb.find('m:sheets', NS) if s.get('name') == SHEET]
    require(len(sheets) == 1, 'SHEET_MISSING_OR_AMBIGUOUS')
    rel = rels[sheets[0].get(REL)]
    require(rel.get('TargetMode') != 'External', 'INVALID_SHEET_PATH')
    target = rel.get('Target', '')
    name = target.lstrip('/') if target.startswith('/') else posixpath.normpath('xl/' + target)
    require(name.startswith('xl/') and name in archive.namelist(), 'INVALID_SHEET_PATH')
    return name


def tag_end(raw, start):
    quote = None
    for i in range(start, len(raw)):
        char = raw[i]
        if quote:
            if char == quote:
                quote = None
        elif char in (34, 39):
            quote = char
        elif char == 62:
            return i + 1
    raise Blocked('INVALID_XML_TAG')


def cell_spans(raw, targets):
    require(b'<!DOCTYPE' not in raw.upper() and b'<!ENTITY' not in raw.upper(), 'UNSUPPORTED_XML')
    require(not raw.startswith((b'\xff\xfe', b'\xfe\xff')), 'UNSUPPORTED_XML_ENCODING')
    parser = expat.ParserCreate(namespace_separator='}')
    stack, spans = [], {}

    def start(name, attrs):
        stack.append((name, attrs.get('r'), parser.CurrentByteIndex))

    def end(name):
        tag, ref, offset = stack.pop()
        if tag == NS['m'] + '}c' and ref in targets:
            require(ref not in spans, 'DUPLICATE_CELL')
            opening_end = tag_end(raw, offset)
            finish = opening_end if raw[opening_end - 2:opening_end] == b'/>' else tag_end(raw, parser.CurrentByteIndex)
            spans[ref] = (offset, finish)

    parser.StartElementHandler, parser.EndElementHandler = start, end
    parser.Parse(raw, True)
    require(set(spans) == set(targets), 'PREFORMATTED_TARGET_CELLS_REQUIRED')
    return spans


def preserved_bytes(source_raw, artifact_raw, proposal):
    """Copy only Artifact-authored cell payloads into original blank cells."""
    targets = {column + str(proposal['candidate_row']) for column in 'CDEFGH'}
    with zipfile.ZipFile(io.BytesIO(source_raw)) as source, zipfile.ZipFile(io.BytesIO(artifact_raw)) as artifact:
        part = sheet_part(source)
        raw = source.read(part)
        spans = cell_spans(raw, targets)
        original = {c.get('r'): c for c in ET.fromstring(raw).findall('m:sheetData/m:row/m:c', NS)
                    if c.get('r') in targets}
        authored = {c.get('r'): c for c in ET.fromstring(artifact.read(sheet_part(artifact))).findall('m:sheetData/m:row/m:c', NS)
                    if c.get('r') in targets}
        require(set(authored) == targets, 'ARTIFACT_TARGET_CELLS_MISSING')
        replacements = []
        for ref in sorted(targets):
            before, after = original[ref], authored[ref]
            require(len(before) == 0 and not before.text, 'TARGET_NOT_EMPTY')
            require(after.get('t', 'n') in ('str', 'n') and len(after) == 1 and
                    after[0].tag == '{' + NS['m'] + '}v' and len(after[0]) == 0,
                    'ARTIFACT_VALUE_TYPE_UNSUPPORTED')
            # Retain destination style and metadata; never copy export style IDs.
            cell = copy.deepcopy(before)
            cell.set('t', after.get('t', 'n'))
            cell.append(copy.deepcopy(after[0]))
            replacements.append((*spans[ref], ET.tostring(cell, encoding='utf-8')))
        for start, finish, fragment in sorted(replacements, reverse=True):
            raw = raw[:start] + fragment + raw[finish:]
        output = io.BytesIO()
        with zipfile.ZipFile(output, 'w') as result:
            result.comment = source.comment
            for info in source.infolist():
                result.writestr(info, raw if info.filename == part else source.read(info.filename))
    return output.getvalue()


def package(source, artifact, request, output):
    source, artifact, output = Path(source), Path(artifact), Path(output)
    require(output.resolve() not in (source.resolve(), artifact.resolve()), 'SAME_FILE_REJECTED')
    require(not output.exists() and not output.is_symlink(), 'OUTPUT_ALREADY_EXISTS')
    proposal = propose(read_book(source), request)
    # Bound and validate both packages before parsing them; read once, then
    # compare source bytes to the exact proposal digest to prevent stale input.
    artifact_sha256 = read_book(artifact)['sha256']
    source_raw, artifact_raw = source.read_bytes(), artifact.read_bytes()
    require(hashlib.sha256(source_raw).hexdigest() == proposal['workbook_sha256'], 'WORKBOOK_CHANGED')
    require(len(artifact_raw) <= 20_000_000, 'WORKBOOK_TOO_LARGE')
    require(hashlib.sha256(artifact_raw).hexdigest() == artifact_sha256, 'ARTIFACT_CHANGED')
    candidate = preserved_bytes(source_raw, artifact_raw, proposal)
    temporary = None
    try:
        with tempfile.NamedTemporaryFile(dir=output.parent, prefix='.fe-copy-', suffix='.xlsx', delete=False) as f:
            temporary = Path(f.name)
            f.write(candidate)
            f.flush()
            os.fsync(f.fileno())
        audit = verify(source, temporary, request)
        require(audit['status'] == 'copy_preservation_checks_passed', 'PRESERVATION_AUDIT_REJECTED')
        require(hashlib.sha256(source.read_bytes()).hexdigest() == proposal['workbook_sha256'], 'WORKBOOK_CHANGED')
        # Atomic exclusive publication of a NEW local copy, never an overwrite.
        os.link(temporary, output)
        return {'status': 'isolated_copy_preserved', 'production_writable': False,
                'proposal_id': proposal['proposal_id'], 'audit': audit,
                'pending': ['visual_review', 'native_excel_recalculation', 'server_integration', 'atomic_remote_commit']}
    finally:
        if temporary is not None:
            temporary.unlink(missing_ok=True)


def main():
    p = argparse.ArgumentParser(description=__doc__)
    for name in ('source', 'artifact', 'request', 'output'):
        p.add_argument(name)
    a = p.parse_args()
    try:
        result = package(a.source, a.artifact, json.loads(Path(a.request).read_text()), a.output)
    except (Blocked, ValueError, TypeError, KeyError, IndexError, OSError, zipfile.BadZipFile,
            ET.ParseError, expat.ExpatError) as exc:
        result = {'status': 'blocked', 'production_writable': False,
                  'reason': str(exc) if isinstance(exc, Blocked) else 'INVALID_INPUT'}
    print(json.dumps(result, ensure_ascii=False, indent=2))
    raise SystemExit(2 if result['status'] == 'blocked' else 0)


if __name__ == '__main__':
    main()
