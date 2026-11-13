"""Minimal XML fixtures only; exercise package preservation and rejected writes."""
import copy
import hashlib
from pathlib import Path
import sys
import tempfile
import unittest
from unittest.mock import patch
from xml.sax.saxutils import escape
import zipfile

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
import accounts_2027_package as pack
from accounts_2027 import HEADERS, NS, REL, SHEET, Blocked, propose, read_book
from accounts_2027_verify import verify
from test_accounts_2027 import request


def fixture(path, proposal=None, prefix='', quote='"'):
    """Synthetic package, not an authored/delivered business workbook."""
    q = lambda name: prefix + name
    attr = lambda k, v: k + '=' + quote + v + quote
    def cell(ref, value=None, style='1'):
        attrs = attr('r', ref) + ' ' + attr('s', style)
        if value is None:
            return '<' + q('c') + ' ' + attrs + '/>'
        kind, text = value
        return '<' + q('c') + ' ' + attrs + ' ' + attr('t', kind) + '><' + q('v') + '>' + escape(str(text)) + '</' + q('v') + '></' + q('c') + '>'
    header = ''.join('<'+q('c')+' r="'+chr(65+i)+'3" t="inlineStr"><'+q('is')+'><'+q('t')+'>'+escape(h)+'</'+q('t')+'></'+q('is')+'></'+q('c')+'>' for i,h in enumerate(HEADERS))
    values = {col: None for col in 'CDEFGH'}
    if proposal:
        p = proposal['proposed_cells']
        for col in 'CEFG':
            values[col] = ('str', p[col])
        values['D'] = ('n', 46458)  # 2027-03-12 in the Excel 1900 date system.
        values['H'] = ('n', p['H']['amount_cents'] / 100)
    xmlns = 'xmlns' + (':' + prefix[:-1] if prefix else '')
    xml = '<?xml version="1.0" encoding="UTF-8"?><'+q('worksheet')+' '+xmlns+'="'+NS['m']+'"><'+q('sheetData')+'><'+q('row')+' r="3">'+header+'</'+q('row')+'><'+q('row')+' r="9"><'+q('c')+' r="A9" t="inlineStr"><'+q('is')+'><'+q('t')+'>MARZO</'+q('t')+'></'+q('is')+'></'+q('c')+'></'+q('row')+'><'+q('row')+' r="11">'+''.join(cell(c+'11',values[c], '99' if proposal else '1') for c in 'CDEFGH')+'</'+q('row')+'><'+q('row')+' r="15"><'+q('c')+' r="A15" t="inlineStr"><'+q('is')+'><'+q('t')+'>ABRIL</'+q('t')+'></'+q('is')+'></'+q('c')+'></'+q('row')+'></'+q('sheetData')+'></'+q('worksheet')+'>'
    with zipfile.ZipFile(path, 'w') as z:
        z.comment = b'KEEP ARCHIVE COMMENT'
        z.writestr('xl/workbook.xml', '<workbook xmlns="'+NS['m']+'" xmlns:r="'+REL[1:].split('}')[0]+'"><sheets><sheet name="'+SHEET+'" sheetId="1" r:id="rId1"/></sheets></workbook>')
        z.writestr('xl/_rels/workbook.xml.rels', '<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>')
        z.writestr('xl/worksheets/sheet1.xml', xml)
        z.writestr('xl/styles.xml', '<styleSheet/>')
        z.writestr('xl/media/keep.bin', b'KEEP BINARY PART EXACTLY')


class PackagingTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.source, self.artifact, self.output = [self.root / x for x in ('source.xlsx', 'artifact.xlsx', 'output.xlsx')]
        self.req = request()
        # Include Unicode and markup: XML byte offsets must remain exact.
        self.req['event']['place'] = 'Lugar ficticio Málaga & Granada'
        self.reset()

    def reset(self, prefix='', quote='"'):
        fixture(self.source, prefix=prefix, quote=quote)
        self.req['workbook_sha256'] = hashlib.sha256(self.source.read_bytes()).hexdigest()
        self.proposal = propose(read_book(self.source), self.req)
        fixture(self.artifact, self.proposal)
        self.before = self.source.read_bytes()

    def test_export_changed_after_validation_is_rejected(self):
        def validate(path):
            result = read_book(path)
            if path == self.artifact:
                fixture(path, self.proposal, prefix='m:')
            return result

        with patch.object(pack, 'read_book', side_effect=validate):
            with self.assertRaisesRegex(Blocked, 'ARTIFACT_CHANGED'):
                pack.package(self.source, self.artifact, self.req, self.output)
        self.assertFalse(self.output.exists())
        self.assertEqual(self.source.read_bytes(), self.before)

    def test_audit_digest_identifies_the_single_candidate_read(self):
        pack.package(self.source, self.artifact, self.req, self.output)
        exact = self.output.read_bytes()
        original_read = Path.read_bytes
        reads = []

        def read(path):
            if path == self.output:
                reads.append(path)
                return exact if len(reads) == 1 else b'changed after inspection'
            return original_read(path)

        with patch.object(Path, 'read_bytes', read):
            audit = verify(self.source, self.output, self.req)
        self.assertEqual(audit['candidate_sha256'], hashlib.sha256(exact).hexdigest())
        self.assertEqual(audit['status'], 'copy_preservation_checks_passed')
        self.assertEqual(reads, [self.output])

    def test_six_cells_pass_existing_independent_audit(self):
        out = pack.package(self.source, self.artifact, self.req, self.output)
        self.assertEqual(out['status'], 'isolated_copy_preserved')
        self.assertFalse(out['production_writable'])
        self.assertEqual(verify(self.source, self.output, self.req)['differences'], [])
        self.assertEqual(self.source.read_bytes(), self.before)
        with zipfile.ZipFile(self.source) as a, zipfile.ZipFile(self.output) as b:
            self.assertEqual(a.comment, b.comment)
            self.assertEqual(a.namelist(), b.namelist())
            changed = [n for n in a.namelist() if a.read(n) != b.read(n)]
            self.assertEqual(changed, ['xl/worksheets/sheet1.xml'])

    def test_prefixes_and_single_quoted_attributes_preserved(self):
        self.reset(prefix='m:', quote="'")
        pack.package(self.source, self.artifact, self.req, self.output)
        self.assertEqual(verify(self.source, self.output, self.req)['differences'], [])

    def test_wrong_artifact_values_fail_without_publishing_output(self):
        wrong = copy.deepcopy(self.proposal)
        wrong['proposed_cells']['H']['amount_cents'] += 1
        fixture(self.artifact, wrong)
        with self.assertRaisesRegex(Blocked, 'PRESERVATION_AUDIT_REJECTED'):
            pack.package(self.source, self.artifact, self.req, self.output)
        self.assertFalse(self.output.exists())
        self.assertFalse(list(self.root.glob('.fe-copy-*')))
        self.assertEqual(self.source.read_bytes(), self.before)

    def test_existing_output_and_same_source_rejected(self):
        self.output.write_bytes(b'KEEP')
        with self.assertRaisesRegex(Blocked, 'OUTPUT_ALREADY_EXISTS'):
            pack.package(self.source, self.artifact, self.req, self.output)
        self.assertEqual(self.output.read_bytes(), b'KEEP')
        with self.assertRaisesRegex(Blocked, 'SAME_FILE_REJECTED'):
            pack.package(self.source, self.artifact, self.req, self.source)

    def test_formula_range_blocks_blank_row_before_export(self):
        with zipfile.ZipFile(self.source) as archive:
            parts = {name: archive.read(name) for name in archive.namelist()}
        sheet = 'xl/worksheets/sheet1.xml'
        for kind, formula in (
            ('array', '<f t="array" ref="V10:V12">ROW(V10:V12)</f>'),
            ('dataTable', '<f t="dataTable" ref="V10:W12" dt2D="1" r1="V1" r2="W1"/>'),
        ):
            with self.subTest(kind=kind):
                parts_with_formula = dict(parts)
                parts_with_formula[sheet] = parts[sheet].replace(
                    b'<row r="11">',
                    f'<row r="10"><c r="V10">{formula}<v>1</v></c></row><row r="11">'.encode())
                with zipfile.ZipFile(self.source, 'w') as archive:
                    for name, data in parts_with_formula.items():
                        archive.writestr(name, data)
                original = self.source.read_bytes()
                self.req['workbook_sha256'] = hashlib.sha256(original).hexdigest()
                output = self.root / f'{kind}.xlsx'
                with self.assertRaisesRegex(Blocked, 'ROW_HAS_FORMULA_RANGE'):
                    pack.package(self.source, self.artifact, self.req, output)
                self.assertFalse(output.exists())
                self.assertFalse(list(self.root.glob('.fe-copy-*')))
                self.assertEqual(self.source.read_bytes(), original)

    def test_calculated_month_marker_blocks_packaging(self):
        with zipfile.ZipFile(self.source) as archive:
            parts = {name: archive.read(name) for name in archive.namelist()}
        sheet = 'xl/worksheets/sheet1.xml'
        for ref, month in (('A9', 'MARZO'), ('A15', 'ABRIL')):
            with self.subTest(marker=ref):
                original_marker = f'<c r="{ref}" t="inlineStr"><is><t>{month}</t></is></c>'
                cached_marker = f'<c r="{ref}" t="str"><f>"{month}"</f><v>{month}</v></c>'
                changed = parts[sheet].replace(original_marker.encode(), cached_marker.encode())
                self.assertNotEqual(parts[sheet], changed)
                with zipfile.ZipFile(self.source, 'w') as archive:
                    for name, data in parts.items():
                        archive.writestr(name, changed if name == sheet else data)
                original = self.source.read_bytes()
                self.req['workbook_sha256'] = hashlib.sha256(original).hexdigest()
                output = self.root / f'{ref}.xlsx'
                with self.assertRaisesRegex(Blocked, 'CALCULATED_MONTH_MARKER'):
                    pack.package(self.source, self.artifact, self.req, output)
                self.assertFalse(output.exists())
                self.assertFalse(list(self.root.glob('.fe-copy-*')))
                self.assertEqual(self.source.read_bytes(), original)

    def test_changed_request_cannot_publish_under_previous_proposal(self):
        changed = copy.deepcopy(self.req)
        changed['contract']['sha256'] = 'c' * 64
        # Different contract identity with identical cell values.
        with self.assertRaisesRegex(Blocked, 'PROPOSAL_CHANGED'):
            pack.package(self.source, self.artifact, changed, self.output,
                         expected_proposal_id=self.proposal['proposal_id'])
        self.assertFalse(self.output.exists())
        self.assertFalse(list(self.root.glob('.fe-copy-*')))
        self.assertEqual(self.source.read_bytes(), self.before)
        result = pack.package(self.source, self.artifact, self.req, self.output,
                              expected_proposal_id=self.proposal['proposal_id'])
        self.assertEqual(result['proposal_id'], self.proposal['proposal_id'])

    def test_request_changed_during_audit_cannot_publish_copy(self):
        def audit_changed_request(source, candidate, request):
            request['contract']['sha256'] = 'c' * 64
            return verify(source, candidate, request)

        with patch.object(pack, 'verify', side_effect=audit_changed_request):
            with self.assertRaisesRegex(Blocked, 'PROPOSAL_CHANGED'):
                pack.package(self.source, self.artifact, self.req, self.output)
        self.assertFalse(self.output.exists())
        self.assertFalse(list(self.root.glob('.fe-copy-*')))
        self.assertEqual(self.source.read_bytes(), self.before)

    def test_audit_of_different_candidate_bytes_cannot_publish_copy(self):
        def audit_changed_candidate(source, candidate, request):
            with zipfile.ZipFile(candidate, 'a') as archive:
                archive.comment = b'CHANGED SYNTHETIC COMMENT'
            return verify(source, candidate, request)

        with patch.object(pack, 'verify', side_effect=audit_changed_candidate):
            with self.assertRaisesRegex(Blocked, 'CANDIDATE_CHANGED'):
                pack.package(self.source, self.artifact, self.req, self.output)
        self.assertFalse(self.output.exists())
        self.assertFalse(list(self.root.glob('.fe-copy-*')))
        self.assertEqual(self.source.read_bytes(), self.before)

    def test_stale_source_rejected(self):
        self.req['workbook_sha256'] = 'f' * 64
        with self.assertRaisesRegex(Blocked, 'WORKBOOK_CHANGED'):
            pack.package(self.source, self.artifact, self.req, self.output)
        self.assertFalse(self.output.exists())

    def test_destination_and_artifact_symlinks_cannot_overwrite_source(self):
        self.output.symlink_to(self.source)
        with self.assertRaisesRegex(Blocked, 'SAME_FILE_REJECTED'):
            pack.package(self.source, self.artifact, self.req, self.output)
        self.assertEqual(self.source.read_bytes(), self.before)

    def test_missing_preformatted_cells_or_external_entities_rejected(self):
        with self.assertRaisesRegex(Blocked, 'PREFORMATTED_TARGET_CELLS_REQUIRED'):
            pack.cell_spans(b'<worksheet/>', {'C11'})
        with self.assertRaisesRegex(Blocked, 'UNSUPPORTED_XML'):
            pack.cell_spans(b'<!DOCTYPE x [<!ENTITY x "evil">]><x/>', {'C11'})

    def test_unsupported_artifact_formula_is_rejected(self):
        raw = pack.preserved_bytes
        # Minimal malformed Artifact cell: changing <v> to <f> must never be
        # copied as a formula, even when its text resembles the expected value.
        with zipfile.ZipFile(self.artifact) as z:
            parts = {n: z.read(n) for n in z.namelist()}
        parts['xl/worksheets/sheet1.xml'] = parts['xl/worksheets/sheet1.xml'].replace(b'<v>46458</v>', b'<f>46458</f>')
        with zipfile.ZipFile(self.artifact, 'w') as z:
            for n, data in parts.items():
                z.writestr(n, data)
        with self.assertRaisesRegex(Blocked, 'ARTIFACT_VALUE_TYPE_UNSUPPORTED'):
            pack.package(self.source, self.artifact, self.req, self.output)
        self.assertFalse(self.output.exists())


if __name__ == '__main__':
    unittest.main()
