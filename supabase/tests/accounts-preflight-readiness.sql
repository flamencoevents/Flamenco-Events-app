-- Read-only readiness check for the fictitious CUENTAS 27 rehearsal.
-- Report counts only. This does not download documents or verify their bytes.
begin read only;

with fictitious_events as (
  select e.id, e.enquiry_id, e.quote_terms_id
  from public.events e
  where e.is_test is true
    and e.event_date >= date '2027-01-01'
    and e.event_date < date '2028-01-01'
), local_evidence as (
  select e.id,
    (q.is_test is true and q.stage = 'accepted'
      and q.call_completed_at is not null and q.approved_at is not null
      and q.quote_sent_at is not null
      and qt.enquiry_id = e.enquiry_id
      and qt.deposit_payable_eur is not null and qt.tax_details is not null
      and qt.billing_mode <> 'individual_full_invoice'
      and coalesce(qt.tax_details->>'payment_method', '') <> 'efectivo100') as commercial_evidence,
    (c.quotation_number = qt.quote_number and d.kind = 'contract'
      and d.version = qt.version and d.source_reference = qt.external_reference
      and d.sha256 ~ '^[a-f0-9]{64}$'
      and d.storage_path ~ ('^' || e.id::text || '/contract-v' || qt.version::text || '-[a-f0-9]{64}\.pdf$')
      and exists (
        select 1
        from storage.objects o
        join storage.buckets b on b.id = o.bucket_id
        where o.bucket_id = 'event-documents' and b.public is false
          and o.name = d.storage_path
      )) as private_document_metadata
  from fictitious_events e
  left join public.enquiries q on q.id = e.enquiry_id
  left join public.accepted_quote_terms qt on qt.id = e.quote_terms_id
  left join public.event_contracts c on c.event_id = e.id
  left join public.event_documents d on d.id = c.document_id and d.event_id = e.id
)
select
  (select test_mode from public.app_runtime where singleton is true) as test_mode,
  count(distinct id) as fictitious_2027_events,
  count(distinct id) filter (where commercial_evidence) as with_commercial_evidence,
  count(distinct id) filter (where commercial_evidence and private_document_metadata) as ready_for_byte_check
from local_evidence;

rollback;
