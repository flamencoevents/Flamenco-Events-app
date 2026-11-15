"""Fictitious offline contract-to-accounts rehearsal. No network or writes.

Consumes the existing FE_Cola/FE_Contratos row shapes, rechecks their embedded
FE3 snapshot, and prepares C:H using accounts_2027. Input is not authentication
or evidence of signature/payment/closure. Never commit private input/output.
"""
import argparse
import copy
import datetime as dt
from decimal import Decimal, InvalidOperation
import hashlib
import json
from pathlib import Path
import re
import zipfile
import xml.etree.ElementTree as ET

from accounts_2027 import (Blocked, clean_text, digest, parse_account_json as parsed,
                           propose, read_account_json, read_book, read_bounded, require)

PDF_LIMIT = 10_485_760


def cents(value):
    require(type(value) in (int, float), 'INVALID_SAVED_AMOUNT')
    number = Decimal(str(value))
    require(number.is_finite() and abs(number) <= Decimal('9999999999.99'), 'INVALID_SAVED_AMOUNT')
    number *= 100
    require(number == number.to_integral_value(), 'SUBCENT_AMOUNT_REQUIRES_REVIEW')
    return int(number)


def match_web_preflight(evidence, event_id, event_date, number, revision, pdf_sha, size):
    # Compare an offline copy of the web response. Its presence does not
    # authenticate the caller or prove that any remote operation occurred.
    expected = {'state': 'accounts_source_checked', 'event_id': event_id,
                'quote_number': number, 'version': revision,
                'pdf_sha256': pdf_sha, 'size_bytes': size}
    required_checks = ('source_response_hmac', 'source_pdf_checksum', 'stored_document_metadata',
                       'accepted_financial_values', 'stored_pdf_bytes')
    require(isinstance(evidence, dict), 'WEB_PREFLIGHT_MISMATCH')
    if 'event_date' in evidence:
        expected['event_date'] = event_date
    checks = evidence.get('checks')
    require(all(evidence.get(k) == v for k, v in expected.items())
            and type(evidence.get('version')) is int and type(evidence.get('size_bytes')) is int
            and evidence.get('is_forecast') is True
            and all(evidence.get(k) is False for k in ('stored', 'production_writable', 'remote_committed'))
            and isinstance(checks, dict) and all(checks.get(k) is True for k in required_checks),
            'WEB_PREFLIGHT_MISMATCH')


def prepare(book, envelope, pdf, *, web_pdf=None, web_preflight=None):
    """Prepare from a parsed workbook or open a path after validating the contract inputs."""
    require(envelope.get('test_mode') is True, 'FICTIONAL_ONLY')
    require(envelope.get('source_system') == 'whatsapp', 'WRONG_SOURCE')
    require(envelope.get('source_sheet') in ('FE_Cola', 'FE_App_Pruebas'), 'WRONG_SOURCE')
    qrow, crow = envelope['quote_row'], envelope['contract_row']
    require(isinstance(qrow, list) and len(qrow) >= 5 and isinstance(crow, list) and len(crow) >= 7,
            'INVALID_QUEUE_ROW')
    require(qrow[3] == 'GENERADO' and crow[1] == 'GENERADO', 'DOCUMENT_NOT_GENERATED')
    q, contract = parsed(qrow[4]), parsed(crow[2])
    require(q.get('modelo') == 'FE3' and q.get('modoPrueba') is True, 'FICTIONAL_ONLY')
    number, version = q['id'], q['revision']
    require(isinstance(number, str) and re.fullmatch(r'(?:[0-9]{5,7}|X[0-9]{2}-P[0-9]{6})', number), 'INVALID_NUMBER')
    require(type(version) is int and 1 <= version <= 99, 'INVALID_REVISION')
    require(q['key'] == number + '-v' + str(version), 'INVALID_SOURCE_KEY')
    require(qrow[0] == q['key'] and str(qrow[1]) == number and type(qrow[2]) is int and qrow[2] == version,
            'QUEUE_IDENTITY_MISMATCH')
    require(str(crow[0]) == number and digest(contract['presupuesto']) == digest(q), 'CONTRACT_SNAPSHOT_CHANGED')
    # Presence of a Drive reference is recorded, never treated as a public URL
    # or proof that these locally supplied bytes came from Drive.
    require(isinstance(crow[6], str) and re.fullmatch(r'https://drive\.google\.com/file/d/[A-Za-z0-9_-]+/view', crow[6]),
            'MISSING_PRIVATE_PDF_REFERENCE')
    require(isinstance(pdf, bytes) and 5 < len(pdf) <= PDF_LIMIT and pdf.startswith(b'%PDF-'), 'INVALID_PDF_BYTES')
    pdf_sha = hashlib.sha256(pdf).hexdigest()
    require(envelope.get('expected_pdf_sha256') == pdf_sha, 'PDF_DIGEST_MISMATCH')
    if web_pdf is not None:
        require(isinstance(web_pdf, bytes) and 5 < len(web_pdf) <= PDF_LIMIT
                and web_pdf.startswith(b'%PDF-'), 'INVALID_WEB_PDF_BYTES')
        require(hashlib.sha256(web_pdf).hexdigest() == pdf_sha, 'WEB_PDF_DIGEST_MISMATCH')
    c, request, fields = q['calculo'], q['request'], q['fields']
    client_type, payment = request['tipo_cliente'], request.get('forma_cobro', 'habitual')
    require(client_type in ('empresa', 'particular', 'particular_base'), 'UNSUPPORTED_CLIENT_TYPE')
    require(payment == 'habitual', 'CONTRACT_CLAUSE_NOT_APPROVED')
    amounts = {key: cents(c[key]) for key in ('total', 'reserva', 'pendiente', 'base', 'iva', 'irpf')}
    require(amounts['total'] >= 0 and 0 <= amounts['reserva'] <= amounts['total'] and
            0 <= amounts['pendiente'] <= amounts['total'], 'INVALID_SAVED_TOTALS')
    # No inferred equation between total, tax base or reservation: preserve
    # existing modality/rounding/explicit Bizum arrangements without recalculating.
    date_text = fields['fecha_evento']
    require(isinstance(date_text, str) and re.fullmatch(r'[0-9]{2}/[0-9]{2}/[0-9]{4}', date_text), 'AMBIGUOUS_EVENT_DATE')
    try:
        date = dt.datetime.strptime(date_text, '%d/%m/%Y').date().isoformat()
    except ValueError:
        raise Blocked('INVALID_EVENT_DATE') from None
    event = envelope['event']
    require(event.get('is_test') is True, 'FICTIONAL_ONLY')
    require(event['quote_number'] == number and type(event['version']) is int and event['version'] == version and
            event['source_key'] == q['key'] and event['date'] == date, 'EVENT_SOURCE_MISMATCH')
    if web_preflight is not None:
        match_web_preflight(web_preflight, event['id'], date, number, version, pdf_sha, len(pdf))
    # The contract has no mandatory schedule field. Use only an explicit event
    # schedule; never infer one from duration/passes or invent a missing time.
    schedule = clean_text(event['schedule'])
    quote_sha = hashlib.sha256(qrow[4].encode()).hexdigest()
    source = {'system': 'whatsapp', 'sheet': envelope['source_sheet'], 'key': q['key'],
              'quotation_sha256': quote_sha,
              'contract_snapshot_sha256': hashlib.sha256(crow[2].encode()).hexdigest(),
              'pdf_sha256': pdf_sha}
    source_sha = digest({'source': source, 'drive_reference': crow[6]})
    if isinstance(book, (str, Path)):
        book = read_book(book)
    planner = {'test_mode': True, 'workbook_sha256': book['sha256'], 'currency': 'EUR',
               'candidate_row': envelope['candidate_row'],
               'event': {'id': clean_text(event['id']), 'is_test': True, 'date': date, 'schedule': schedule,
                         'place': clean_text(fields['lugar_evento']), 'client': clean_text(request['cliente'])},
               'quotation': {'number': number, 'key': q['key'], 'revision': version,
                             'sha256': quote_sha, 'total_cents': amounts['total']}}
    planner['contract'] = dict(planner['quotation'], sha256=pdf_sha, quotation_sha256=quote_sha,
                               event_id=event['id'], event_date=date)
    planner['contract']['source_sha256'] = source_sha
    proposal = propose(book, planner)
    saved = copy.deepcopy(c)
    result = {'mode': 'offline_contract_rehearsal', 'status': 'pending_review', 'production_writable': False,
              'signature_verified': False, 'payment_verified': False, 'commercial_closure_verified': False,
              'remote_origin_verified': False, 'balances_changed': False,
              'proposal': proposal, 'planner_request': planner,
              'source': source,
              'saved_calculation': saved,
              'contract_payment': {k: copy.deepcopy(contract['cliente'][k]) for k in ('bizum', 'reservaBizum')
                                   if k in contract.get('cliente', {})},
              'pending': ['authenticated_source_read', 'commercial_sequence_verification', 'closure_rules',
                          'xlsx_copy_preservation', 'native_excel_review', 'operation_ledger', 'server_integration']}
    if web_pdf is not None:
        result['local_pdf_copies_match'] = True
    if web_preflight is not None:
        result['local_web_preflight_matches'] = True
        result['local_web_event_date_matches'] = 'event_date' in web_preflight
    result['rehearsal_id'] = digest(result)
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('workbook')
    p.add_argument('envelope')
    p.add_argument('pdf')
    p.add_argument('--web-pdf', help='Local copy of the fictitious PDF from the web')
    p.add_argument('--web-preflight', help='Local copy of the read-only web accounts preflight for the fictitious event')
    a = p.parse_args()
    try:
        envelope = read_account_json(a.envelope)
        require(envelope.get('test_mode') is True, 'FICTIONAL_ONLY')
        pdf = read_bounded(a.pdf, PDF_LIMIT, 'INVALID_PDF_BYTES')
        web_pdf = read_bounded(a.web_pdf, PDF_LIMIT, 'INVALID_WEB_PDF_BYTES') if a.web_pdf else None
        web_preflight = None
        if a.web_preflight:
            web_preflight = read_account_json(a.web_preflight)
        result = prepare(Path(a.workbook), envelope, pdf, web_pdf=web_pdf, web_preflight=web_preflight)
    except (Blocked, ValueError, TypeError, KeyError, AttributeError, IndexError, OSError,
            InvalidOperation, zipfile.BadZipFile, ET.ParseError) as exc:
        result = {'status': 'blocked', 'production_writable': False,
                  'reason': str(exc) if isinstance(exc, Blocked) else 'INVALID_INPUT'}
    print(json.dumps(result, ensure_ascii=False, allow_nan=False, indent=2))
    raise SystemExit(2 if result['status'] == 'blocked' else 0)


if __name__ == '__main__':
    main()
