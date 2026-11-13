-- Staging-only quality gates: a prospect cannot be qualified until its source is recorded.
-- They are deliberately database constraints, not just visual/form checks.
alter table public.fe_prospects add constraint fe_prospects_qualified_source_check
 check(marketing_status <> 'cualificado' or
 (nullif(btrim(source_url),'') is not null and source_checked_at is not null));
alter table public.fe_hospitality_prospects add constraint fe_hospitality_qualified_source_check
 check(marketing_status <> 'cualificado' or
 (nullif(btrim(source_url),'') is not null and checked_at is not null));
alter table public.fe_brand_partners add constraint fe_brands_qualified_source_check
 check(status <> 'cualificada' or
 (nullif(btrim(source_url),'') is not null and checked_at is not null));
-- No automatic sends, no campaign activation and no changes to existing events.
