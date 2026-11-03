-- Additional workflow protections; apply after supabase/schema.sql.
-- A lead may only advance to quote-approved after Azahara's call.
-- 'sent' and 'accepted' require a recorded call, explicit approval and sent timestamp.
alter table public.enquiries drop constraint if exists enquiry_stage_gate;
alter table public.enquiries add constraint enquiry_stage_gate check (
  (stage not in ('called','approved','sent','accepted') or call_completed_at is not null)
  and (stage not in ('approved','sent','accepted') or approved_at is not null)
  and (stage not in ('sent','accepted') or quote_sent_at is not null)
);
-- The public app does not insert enquiry data directly into this database.
-- Enquiry intake must use a separate server-side endpoint with spam controls,
-- evidence of consent, audit logs and validated input.
-- Staff accounts are granted using trusted administration, never self-service.
