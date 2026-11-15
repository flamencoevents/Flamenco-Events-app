"""Exercise the offline accounts CLI using a response from the web test harness."""
import argparse
import base64
import hashlib
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory

from test_accounts_2027_contract import fixture
from test_accounts_2027_package import fixture as workbook_fixture
import accounts_2027_contract as bridge
from accounts_2027_package import package


def run(inputs, *, artifact=False):
    evidence = inputs['evidence']
    pdf = base64.b64decode(inputs['pdf_base64'], validate=True)
    envelope = fixture()
    key = '9999926-v1'
    quote = json.loads(envelope['quote_row'][4])
    quote.update(id='9999926', key=key, revision=1)
    quote['request']['tipo_cliente'] = 'particular'
    quote['calculo'].update(total=100, reserva=30, pendiente=70, base=100,
                            facturada=30, iva=0, irpf=0, redondeoFiscal=0)
    contract = json.loads(envelope['contract_row'][2])
    contract['presupuesto'] = quote
    envelope['quote_row'][:5] = [key, '9999926', 1, 'GENERADO', json.dumps(quote)]
    envelope['contract_row'][0] = '9999926'
    envelope['contract_row'][2] = json.dumps(contract)
    envelope['source_sheet'] = 'FE_Cola'
    envelope['expected_pdf_sha256'] = hashlib.sha256(pdf).hexdigest()
    envelope['event'].update(id=inputs['event_id'], quote_number='9999926', source_key=key, version=1)

    if artifact:
        from run_accounts_2027_artifact_trial import run_artifact_rehearsal
        run_artifact_rehearsal(envelope, pdf, evidence, '100')
        return

    with TemporaryDirectory(prefix='fe-web-contract-') as directory:
        root = Path(directory)
        source, exported, candidate = (root / name for name in ('source.xlsx', 'exported.xlsx', 'candidate.xlsx'))
        request, receipt, pdf_file = (root / name for name in ('request.json', 'receipt.json', 'contract.pdf'))
        request.write_text(json.dumps(envelope), encoding='utf-8')
        receipt.write_text(json.dumps(evidence), encoding='utf-8')
        pdf_file.write_bytes(pdf)
        workbook_fixture(source)
        original = source.read_bytes()
        command = [sys.executable, bridge.__file__, str(source), str(request), str(pdf_file),
                   '--web-preflight', str(receipt)]
        prepared = json.loads(subprocess.check_output(command, text=True, timeout=20))
        workbook_fixture(exported, prepared['proposal'])
        audit = package(source, exported, prepared['planner_request'], candidate,
                        expected_proposal_id=prepared['proposal']['proposal_id'])['audit']

        # Change just one saved cent while retaining the exact receipt and PDF.
        quote['calculo']['total'] = 100.01
        envelope['quote_row'][4] = json.dumps(quote)
        envelope['contract_row'][2] = json.dumps(contract)
        request.write_text(json.dumps(envelope), encoding='utf-8')
        command[2] = str(root / 'absent.xlsx')
        rejected = subprocess.run(command, text=True, capture_output=True, timeout=20)
        return {'checked_date': prepared['local_web_event_date_matches'],
                'checked_amounts': prepared['local_web_financial_matches'],
                'remote_origin_verified': prepared['remote_origin_verified'],
                'differences': audit['differences'],
                'amount_cents': prepared['proposal']['proposed_cells']['H']['amount_cents'],
                'origin_unchanged': source.read_bytes() == original,
                'blocked_exit': rejected.returncode,
                'blocked_reason': json.loads(rejected.stdout)['reason']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--artifact', action='store_true', help='Use the existing local XLSX exporter')
    args = parser.parse_args()
    result = run(json.load(sys.stdin), artifact=args.artifact)
    if not args.artifact:
        print(json.dumps(result))
