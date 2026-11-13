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
import math
from pathlib import Path
import re
import zipfile
import xml.etree.ElementTree as ET

from accounts_2027 import Blocked, clean_text, digest, propose, read_book, require


def cents(value):
    require(type(value) in (int, float), 'INVALID_SAVED_AMOUNT')
    number = Decimal(str(value))
    require(number.is_finite() and abs(number) <= Decimal('9999999999.99'), 'INVALID_SAVED_AMOUNT')
    number *= 100
    require(number == number.to_integral_value(), 'SUBCENT_AMOUNT_REQUIRES_REVIEW')
    return int(number)


def parsed(raw):
    require(isinstance(raw, str) and len(raw.encode()) <= 250000, 'INVALID_SNAPSHOT')
    def unique(pairs):
        obj = {}
        for key, value in pairs:
            require(key not in obj, 'DUPLICATE_JSON_KEY')
            obj[key] = value
        return obj
    def finite_float(token):
        value = float(token)
        require(math.isfinite(value) and Decimal(str(value)) == Decimal(token),
                'INVALID_JSON_NUMBER')
        return value

    value = json.loads(raw, object_pairs_hook=unique, parse_float=finite_float,
                       parse_constant=lambda _: require(False, 'INVALID_JSON_NUMBER'))
    require(isinstance(value, dict), 'INVALID_SNAPSHOT')
    return value


def prepare(book, envelope, pdf):
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
    require(isinstance(number, str) and re.fullmatch(r'(?:\d{5,7}|X\d{2}-P\d{6})', number), 'INVALID_NUMBER')
    require(type(version) is int and 1 <= version <= 99, 'INVALID_REVISION')
    require(q['key'] == number + '-v' + str(version), 'INVALID_SOURCE_KEY')
    require(qrow[0] == q['key'] and str(qrow[1]) == number and type(qrow[2]) is int and qrow[2] == version,
            'QUEUE_IDENTITY_MISMATCH')
    require(str(crow[0]) == number and digest(contract['presupuesto']) == digest(q), 'CONTRACT_SNAPSHOT_CHANGED')
    # Presence of a Drive reference is recorded, never treated as a public URL
    # or proof that these locally supplied bytes came from Drive.
    require(isinstance(crow[6], str) and re.fullmatch(r'https://drive\.google\.com/file/d/[\w-]+/view', crow[6]),
            'MISSING_PRIVATE_PDF_REFERENCE')
    require(isinstance(pdf, bytes) and 5 < len(pdf) <= 10485760 and pdf.startswith(b'%PDF-'), 'INVALID_PDF_BYTES')
    pdf_sha = hashlib.sha256(pdf).hexdigest()
    require(envelope.get('expected_pdf_sha256') == pdf_sha, 'PDF_DIGEST_MISMATCH')
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
    require(isinstance(date_text, str) and re.fullmatch(r'\d{2}/\d{2}/\d{4}', date_text), 'AMBIGUOUS_EVENT_DATE')
    date = dt.datetime.strptime(date_text, '%d/%m/%Y').date().isoformat()
    event = envelope['event']
    require(event.get('is_test') is True, 'FICTIONAL_ONLY')
    require(event['quote_number'] == number and type(event['version']) is int and event['version'] == version and
            event['source_key'] == q['key'] and event['date'] == date, 'EVENT_SOURCE_MISMATCH')
    # The contract has no mandatory schedule field. Use only an explicit event
    # schedule; never infer one from duration/passes or invent a missing time.
    schedule = clean_text(event['schedule'])
    quote_sha = hashlib.sha256(qrow[4].encode()).hexdigest()
    source = {'system': 'whatsapp', 'sheet': envelope['source_sheet'], 'key': q['key'],
              'quotation_sha256': quote_sha,
              'contract_snapshot_sha256': hashlib.sha256(crow[2].encode()).hexdigest(),
              'pdf_sha256': pdf_sha}
    source_sha = digest(source)
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
    result['rehearsal_id'] = digest(result)
    return result


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('workbook')
    p.add_argument('envelope')
    p.add_argument('pdf')
    a = p.parse_args()
    try:
        result = prepare(read_book(a.workbook), parsed(Path(a.envelope).read_text()), Path(a.pdf).read_bytes())
    except (Blocked, ValueError, TypeError, KeyError, AttributeError, IndexError, OSError,
            InvalidOperation, zipfile.BadZipFile, ET.ParseError) as exc:
        result = {'status': 'blocked', 'production_writable': False,
                  'reason': str(exc) if isinstance(exc, Blocked) else 'INVALID_INPUT'}
    print(json.dumps(result, ensure_ascii=False, allow_nan=False, indent=2))
    raise SystemExit(2 if result['status'] == 'blocked' else 0)


if __name__ == '__main__':
    main()
