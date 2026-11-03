-- Actor lookup for the role audit foreign key.
CREATE INDEX IF NOT EXISTS role_change_audit_actor_idx ON public.role_change_audit(actor_id,changed_at DESC);

