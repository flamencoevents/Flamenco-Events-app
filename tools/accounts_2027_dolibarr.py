"""Offline projection of a fictitious Dolibarr customer invoice for review."""
from decimal import Decimal
import re

from accounts_2027 import clean_text, require


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
