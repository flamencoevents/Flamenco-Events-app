-- Immutable audit trail of commercial status transitions.
CREATE TABLE IF NOT EXISTS public.enquiry_audit(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 enquiry_id uuid NOT NULL REFERENCES public.enquiries(id) ON DELETE CASCADE,
 actor_id uuid,
 old_stage text NOT NULL,
 new_stage text NOT NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.enquiry_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY enquiry_audit_team_read ON public.enquiry_audit FOR SELECT TO authenticated USING(public.is_staff());
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES ON public.enquiry_audit FROM anon,authenticated;
CREATE OR REPLACE FUNCTION public.log_enquiry_stage_change() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path='' AS $$
BEGIN
 IF NEW.stage IS DISTINCT FROM OLD.stage THEN
   INSERT INTO public.enquiry_audit(enquiry_id,actor_id,old_stage,new_stage)
   VALUES(NEW.id,auth.uid(),OLD.stage,NEW.stage);
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.log_enquiry_stage_change() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER log_enquiry_stage_change AFTER UPDATE OF stage ON public.enquiries
FOR EACH ROW EXECUTE FUNCTION public.log_enquiry_stage_change();

