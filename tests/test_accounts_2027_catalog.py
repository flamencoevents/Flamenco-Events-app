"""Catalog projection from synthetic XLSX files only."""
import hashlib
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
import zipfile

from test_accounts_2027 import book, request
from test_accounts_2027_package import fixture
import accounts_2027_catalog as projection
from accounts_2027 import propose, read_book


class CatalogTests(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        self.path = Path(directory.name) / 'fictitious.xlsx'
        fixture(self.path, propose(book(), request()))

    def replace_cell(self, old, new):
        part = 'xl/worksheets/sheet1.xml'
        with zipfile.ZipFile(self.path) as source:
            parts = {name: source.read(name) for name in source.namelist()}
        self.assertIn(old, parts[part])
        parts[part] = parts[part].replace(old, new, 1)
        with zipfile.ZipFile(self.path, 'w') as output:
            for name, data in parts.items():
                output.writestr(name, data)

    def test_metadata_and_values_come_from_the_same_workbook_version(self):
        original_sha = hashlib.sha256(self.path.read_bytes()).hexdigest()

        def replace_after_validation(source):
            result = read_book(source)
            self.replace_cell(b'r="C11" s="99" t="str"', b'r="C11" s="99" t="n"')
            return result

        with patch.object(projection, 'read_book', side_effect=replace_after_validation):
            result = projection.catalog(self.path)
        self.assertNotEqual(hashlib.sha256(self.path.read_bytes()).hexdigest(), original_sha)
        self.assertEqual(result['source_sha256'], original_sha)
        self.assertEqual(result['rows'][0]['quote_number'], '00926')

    def test_budget_preserves_cents_and_keeps_invalid_or_subcent_values_unprojected(self):
        for amount, expected in (
            ('1210.9900', '1210.9900'),
            ('1210.99000000000000000000000000001', None),
            ('NaN', None),
        ):
            with self.subTest(amount=amount):
                fixture(self.path, propose(book(), request()))
                self.replace_cell(b'<v>1210.99</v>', f'<v>{amount}</v>'.encode())
                entry = projection.catalog(self.path)['rows'][0]
                self.assertEqual(entry['budget_eur'], expected)
                self.assertEqual(entry['budget_text'], amount)

    def test_only_an_unambiguous_external_hyperlink_is_projected(self):
        rel_ns = projection.REL[1:].split('}')[0]
        target = 'https://example.invalid/quotation'
        rel_part = 'xl/worksheets/_rels/sheet1.xml.rels'
        for tags, mode, relation_type, second_id, expected in (
            ('<hyperlink ref="C11" r:id="rId1"/>', 'External', 'hyperlink', 'rId2', target),
            ('<hyperlink ref="C11" r:id="rId1"/><hyperlink ref="C11" r:id="rId2"/>',
             'External', 'hyperlink', 'rId2', None),
            ('<hyperlink ref="C11" r:id="rId1"/>', 'Internal', 'hyperlink', 'rId2', None),
            ('<hyperlink ref="C11" r:id="rId1"/>', 'External', 'drawing', 'rId2', None),
            ('<hyperlink ref="C11" r:id="rId1"/>', 'External', 'hyperlink', 'rId1', None),
        ):
            with self.subTest(tags=tags, mode=mode, relation_type=relation_type, second_id=second_id):
                fixture(self.path, propose(book(), request()))
                self.replace_cell(b'</worksheet>',
                    f'<hyperlinks xmlns:r="{rel_ns}">{tags}</hyperlinks></worksheet>'.encode())
                with zipfile.ZipFile(self.path, 'a') as output:
                    output.writestr(rel_part, '<Relationships>'
                        f'<Relationship Id="rId1" Target="{target}" TargetMode="{mode}" Type="{rel_ns}/{relation_type}"/>'
                        f'<Relationship Id="{second_id}" Target="{target}-other" TargetMode="External" Type="{rel_ns}/hyperlink"/>'
                        '</Relationships>')
                before = self.path.read_bytes()
                row = projection.catalog(self.path)['rows'][0]
                self.assertEqual(row['source_link'], expected)
                self.assertEqual(row['quote_number'], '00926')
                self.assertEqual(self.path.read_bytes(), before)
