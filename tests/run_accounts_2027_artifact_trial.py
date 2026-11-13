"""Opt-in local Artifact Tool roundtrip using a wholly synthetic contract and XLSX."""
import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
from zipfile import ZipFile
import xml.etree.ElementTree as ET

from test_accounts_2027_contract import PDF, bridge, fixture
from accounts_2027 import HEADERS, NS, REL, SHEET

BUILDER = "import fs from 'node:fs/promises';\nimport { Workbook, SpreadsheetFile } from '@oai/artifact-tool';\n\nconst [layoutPath, output] = process.argv.slice(2);\nconst {sheetName, headers} = JSON.parse(await fs.readFile(layoutPath, 'utf8'));\nconst wb = Workbook.create();\nconst notes = wb.worksheets.add('Notas ficticias');\nnotes.getRange('A1').values = [['Hoja ajena intacta']];\nconst sheet = wb.worksheets.add(sheetName);\nsheet.getRange('A3:Q3').values = [headers];\nsheet.getRange('A9').values = [['MARZO']];\nsheet.getRange('A15').values = [['ABRIL']];\nsheet.getRange('A12').values = [['Enlace ficticio']];\nsheet.getRange('C11:H11').format.fill = '#eeeeee';\nsheet.getRange('D11').format.numberFormat = 'dd/mm/yyyy';\nsheet.getRange('H11').format.numberFormat = '0.00';\nsheet.getRange('V12').formulas = [['=1+2']];\nconst file = await SpreadsheetFile.exportXlsx(wb);\nawait file.save(output);\n"


def main():
    repo = Path(__file__).resolve().parents[1]
    node = os.environ['CODEX_PRIMARY_RUNTIME_NODE']
    modules = Path(os.environ['CODEX_PRIMARY_RUNTIME_NODE_MODULES'])
    planner = repo / 'tools/accounts_2027.py'
    with TemporaryDirectory(prefix='fe-contract-export-') as directory:
        root = Path(directory)
        (root / 'node_modules').symlink_to(modules, target_is_directory=True)
        (root / 'fixture.mjs').write_text(BUILDER, encoding='utf-8')
        (root / 'roundtrip.mjs').write_bytes((repo / 'tools/accounts_2027_roundtrip.mjs').read_bytes())
        (root / 'layout.json').write_text(json.dumps(dict(sheetName=SHEET, headers=HEADERS)))
        subprocess.run([node, 'fixture.mjs', 'layout.json', 'generated.xlsx'],
                       cwd=root, check=True, timeout=180)

        # Artifact creation trims the trailing space. Restore the exact title
        # only in this synthetic input to exercise the real template spelling.
        source = root / 'source.xlsx'
        exact = ('name="' + SHEET + '"').encode()
        trimmed = ('name="' + SHEET.rstrip() + '"').encode()
        with ZipFile(root / 'generated.xlsx') as initial, ZipFile(source, 'w') as synthetic:
            workbook = ET.fromstring(initial.read('xl/workbook.xml'))
            relationships = ET.fromstring(initial.read('xl/_rels/workbook.xml.rels'))
            sheet_node = next(sheet for sheet in workbook.find('m:sheets', NS)
                              if sheet.get('name') in (SHEET, SHEET.rstrip()))
            target = next(rel.get('Target') for rel in relationships
                          if rel.get('Id') == sheet_node.get(REL))
            sheet_xml = target.lstrip('/') if target.startswith('/') else 'xl/' + target
            sheet_path = Path(sheet_xml)
            rels_xml = str(sheet_path.parent / '_rels' / (sheet_path.name + '.rels'))
            if rels_xml in initial.namelist():
                raise RuntimeError('Unexpected relationships in synthetic worksheet')
            for entry in initial.infolist():
                data = initial.read(entry)
                if entry.filename == 'xl/workbook.xml' and exact not in data:
                    if data.count(trimmed) != 1:
                        raise RuntimeError('Unexpected synthetic sheet name')
                    data = data.replace(trimmed, exact)
                if entry.filename == sheet_xml:
                    sheet = ET.fromstring(data)
                    links = ET.Element('{' + NS['m'] + '}hyperlinks')
                    ET.SubElement(links, '{' + NS['m'] + '}hyperlink',
                                  {'ref': 'A12', REL: 'rIdFixture'})
                    sheet.insert(list(sheet).index(sheet.find('m:sheetData', NS)) + 1, links)
                    data = ET.tostring(sheet, encoding='utf-8')
                synthetic.writestr(entry, data)
            synthetic.writestr(
                rels_xml,
                '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                '<Relationship Id="rIdFixture" TargetMode="External" Target="https://example.invalid/fixture" '
                'Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/hyperlink"/>'
                '</Relationships>')

        before = source.read_bytes()
        prepared = bridge.prepare(bridge.read_book(source), fixture(), PDF)
        (root / 'request.json').write_text(json.dumps(prepared['planner_request']))
        writer_env = dict(os.environ, FE_ACCOUNTS_PLANNER=str(planner),
                          FE_ACCOUNTS_PYTHON=sys.executable)
        blocked = subprocess.run([node, 'roundtrip.mjs', 'source.xlsx', 'request.json', 'blocked'],
                                 cwd=root, capture_output=True, text=True, timeout=180,
                                 env=dict(writer_env, FE_ACCOUNTS_EXPECTED_PROPOSAL_ID='0' * 64))
        if (blocked.returncode != 2 or json.loads(blocked.stderr.splitlines()[-1])['reason'] != 'PROPOSAL_CHANGED'
                or (root / 'blocked').exists()):
            raise RuntimeError('A different proposal reached the exporter')
        subprocess.run([node, 'roundtrip.mjs', 'source.xlsx', 'request.json', 'result'],
                       cwd=root, check=True, timeout=180,
                       env=dict(writer_env, FE_ACCOUNTS_EXPECTED_PROPOSAL_ID=prepared['proposal']['proposal_id']))
        candidate = root / 'result/preserved.candidate.xlsx'
        with ZipFile(source) as original, ZipFile(candidate) as copy:
            for part in original.namelist():
                if part != sheet_xml and copy.read(part) != original.read(part):
                    raise RuntimeError("An unrelated workbook part changed")
            if copy.read(rels_xml) != original.read(rels_xml):
                raise RuntimeError('Synthetic hyperlink relationship changed')
        if bridge.read_book(candidate)['links'] != ['A12']:
            raise RuntimeError('Synthetic hyperlink moved or disappeared')
        audit = json.loads((root / 'result/audit.json').read_text())
        if (audit['status'] != 'copy_preservation_checks_passed' or audit['differences']
                or audit['production_writable'] is not False or source.read_bytes() != before
                or audit['proposal_id'] != prepared['proposal']['proposal_id']
                or bridge.read_book(root / 'result/preserved.candidate.xlsx')['cells']['H11']['value'] != '1060.01'):
            raise RuntimeError('Synthetic contract copy did not preserve the expected values')


if __name__ == '__main__':
    main()
