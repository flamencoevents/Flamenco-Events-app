"""Offline projection of a fictitious Dolibarr customer invoice for review."""
from decimal import Decimal
import argparse
import json
import os
import re
from urllib.error import URLError
from urllib.parse import urlsplit
from urllib.request import HTTPRedirectHandler, Request, build_opener

from accounts_2027 import Blocked, clean_text, require


def amount_cents(value):
    require(type(value) in (int, str), 'INVALID_INVOICE_AMOUNT')
    digits = str(value)
    require(re.fullmatch(r'[0-9]{1,10}(?:\.[0-9]{1,2}0*|\.0+)?', digits) is not None
            and len(digits) <= 32, 'INVALID_INVOICE_AMOUNT')
    return int(Decimal(digits) * 100)


def prepare_invoice(rehearsal, invoice, *, test_mode):
    """Validate one explicitly linked fixture. Return invoice figures without posting."""
    require(test_mode is True and invoice.get('is_test') is True and
            rehearsal.get('mode') == 'offline_contract_rehearsal' and
            rehearsal.get('production_writable') is False, 'FICTIONAL_ONLY')
    proposal = rehearsal['proposal']
    identity = proposal['identity']
    require(rehearsal['status'] == 'pending_review' and proposal['writable'] is False,
            'CONTRACT_REHEARSAL_REQUIRED')
    require(invoice.get('ref_ext') == identity['key'], 'INVOICE_SOURCE_MISMATCH')
    require(invoice.get('currency') == 'EUR', 'INVOICE_CURRENCY_UNSUPPORTED')
    # The first adapter covers standard invoices only. Credit notes and
    # deposits require separate handling before accounting reconciliation.
    kind = invoice.get('type')
    require(type(kind) in (int, str) and str(kind) == '0', 'INVOICE_TYPE_UNSUPPORTED')
    invoice_id = invoice.get('id')
    require(type(invoice_id) in (int, str) and
            re.fullmatch(r'[1-9][0-9]{0,18}', str(invoice_id)), 'INVALID_INVOICE_ID')
    return {
        'status': 'pending_review',
        'source': 'dolibarr',
        'invoice_id': str(invoice_id),
        'invoice_reference': clean_text(invoice['ref']),
        'proposal_id': proposal['proposal_id'],
        'event_id': identity['event_id'],
        'source_key': identity['key'],
        'currency': 'EUR',
        'net_cents': amount_cents(invoice['total_ht']),
        'vat_cents': amount_cents(invoice['total_tva']),
        'invoice_total_cents': amount_cents(invoice['total_ttc']),
        'forecast_total_cents': proposal['proposed_cells']['H']['amount_cents'],
        'payment_verified': False,
        'production_writable': False,
    }


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None


def fetch_trial_invoice(base_url, api_key, invoice_id, source_key, *, test_mode):
    """Read a known fixture from an explicitly configured Dolibarr test instance."""
    require(test_mode is True, 'FICTIONAL_ONLY')
    require(re.fullmatch(r'X[0-9]{2}-P[0-9]{6}-v[1-9][0-9]?', source_key),
            'INVALID_TEST_REFERENCE')
    require(re.fullmatch(r'[1-9][0-9]{0,18}', invoice_id), 'INVALID_INVOICE_ID')
    url = urlsplit(base_url)
    require(url.scheme == 'https' and url.hostname and not url.username and
            not url.password and not url.query and not url.fragment, 'INVALID_TEST_URL')
    require(bool(api_key) and not re.search(r'\s', api_key), 'MISSING_TEST_API_KEY')
    request = Request(base_url.rstrip('/') + '/api/index.php/invoices/' + invoice_id
                      + '?contact_list=-1',
                      headers={'Accept': 'application/json', 'DOLAPIKEY': api_key})
    try:
        with build_opener(NoRedirect()).open(request, timeout=15) as response:
            raw = response.read(250001)
    except (OSError, URLError):
        raise Blocked('DOLIBARR_TEST_READ_FAILED') from None
    require(len(raw) <= 250000, 'DOLIBARR_RESPONSE_TOO_LARGE')
    invoice = json.loads(raw, parse_float=Decimal)
    require(isinstance(invoice, dict) and str(invoice.get('id')) == invoice_id and
            invoice.get('ref_ext') == source_key, 'INVOICE_SOURCE_MISMATCH')
    require(str(invoice.get('type')) == '0', 'INVOICE_TYPE_UNSUPPORTED')
    require(not invoice.get('multicurrency_code') or invoice['multicurrency_code'] == 'EUR',
            'INVOICE_CURRENCY_UNSUPPORTED')
    reference = clean_text(invoice['ref'])
    require(re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._/-]{0,79}', reference),
            'INVALID_INVOICE_REFERENCE')
    # The caller confirms this test instance uses EUR as its base currency.
    projection = {'is_test': True, 'currency': 'EUR', 'type': '0', 'id': invoice_id,
                  'ref_ext': source_key, 'ref': reference}
    for field in ('total_ht', 'total_tva', 'total_ttc'):
        value = invoice[field]
        text = format(value, 'f') if isinstance(value, Decimal) and abs(value.adjusted()) <= 30 else str(value)
        amount_cents(text)
        projection[field] = text
    return projection


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--test-mode', action='store_true',
                        help='Use only a fictitious invoice in an isolated EUR instance.')
    parser.add_argument('invoice_id')
    parser.add_argument('source_key')
    args = parser.parse_args()
    try:
        invoice = fetch_trial_invoice(os.environ.get('DOLIBARR_TEST_URL', ''),
                                     os.environ.get('DOLIBARR_TEST_API_KEY', ''),
                                     args.invoice_id, args.source_key, test_mode=args.test_mode)
    except (Blocked, KeyError, ValueError, ArithmeticError) as exc:
        parser.exit(2, (str(exc) if isinstance(exc, Blocked) else 'INVALID_DOLIBARR_DATA') + '\n')
    print(json.dumps(invoice, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
