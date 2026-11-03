-- Audit staff role changes made exclusively through privileged admin backend.
CREATE TABLE public.role_change_audit(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 actor_id uuid NOT NULL REFERENCES auth.users(id),
 target_id uuid NOT NULL REFERENCES auth.users(id),
 old_role text,
 new_role text NOT NULL CHECK(new_role IN ('client','sales')),
 changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.role_change_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_change_audit_admin_read ON public.role_change_audit FOR SELECT TO authenticated
 USING((SELECT app_private.is_admin()));
REVOKE ALL PRIVILEGES ON public.role_change_audit FROM anon;
REVOKE INSERT,UPDATE,DELETE,TRUNCATE,TRIGGER,REFERENCES ON public.role_change_audit FROM authenticated;
CREATE INDEX role_change_audit_target_idx ON public.role_change_audit(target_id,changed_at DESC);
