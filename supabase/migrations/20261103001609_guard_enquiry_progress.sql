-- Protect commercial progression from bypassing Azahara's call and approval.
-- An authenticated commercial may only advance one stage at a time.
CREATE OR REPLACE FUNCTION public.guard_enquiry_progress()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $$
BEGIN
 IF NOT public.is_staff() THEN
   RAISE EXCEPTION 'Commercial staff access required' USING ERRCODE='42501';
 END IF;
 IF NOT public.is_admin() THEN
   IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.contact_name IS DISTINCT FROM OLD.contact_name
    OR NEW.contact_email IS DISTINCT FROM OLD.contact_email
    OR NEW.contact_phone IS DISTINCT FROM OLD.contact_phone
    OR NEW.created_at IS DISTINCT FROM OLD.created_at
    OR NEW.quote_sent_at IS DISTINCT FROM OLD.quote_sent_at
   THEN RAISE EXCEPTION 'Protected enquiry fields' USING ERRCODE='42501'; END IF;
   IF OLD.stage='new' AND NEW.stage='called' THEN
     IF NEW.call_completed_at IS NULL OR NEW.approved_at IS NOT NULL THEN
       RAISE EXCEPTION 'Call timestamp required' USING ERRCODE='23514'; END IF;
   ELSIF OLD.stage='called' AND NEW.stage='approved' THEN
     IF OLD.call_completed_at IS NULL OR NEW.approved_at IS NULL THEN
       RAISE EXCEPTION 'Call must precede approval' USING ERRCODE='23514'; END IF;
   ELSIF NEW.stage IS DISTINCT FROM OLD.stage THEN
     RAISE EXCEPTION 'This transition requires an administrator or protected backend' USING ERRCODE='42501';
   END IF;
 END IF;
 RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS guard_enquiry_progress ON public.enquiries;
CREATE TRIGGER guard_enquiry_progress BEFORE UPDATE ON public.enquiries
FOR EACH ROW EXECUTE FUNCTION public.guard_enquiry_progress();

-- Immutable identity/role on profiles: no self-promotion via public API.
-- Existing RLS grants only SELECT; explicitly revoke mutations from client sessions.
REVOKE INSERT, UPDATE, DELETE ON public.profiles FROM authenticated, anon;

