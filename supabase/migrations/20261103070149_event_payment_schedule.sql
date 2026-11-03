-- Manually documented payment milestones: no collection, invoicing or banking.
CREATE TABLE public.event_payment_schedule (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
 label text NOT NULL CHECK(char_length(btrim(label)) BETWEEN 2 AND 150),
 amount_eur numeric(12,2) NOT NULL CHECK(amount_eur >= 0),
 due_on date,
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','received')),
 received_at timestamptz,
 confirmed_by uuid REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(),
 CHECK (
   (status='pending' AND received_at IS NULL AND confirmed_by IS NULL)
   OR
   (status='received' AND received_at IS NOT NULL AND confirmed_by IS NOT NULL)
 )
);
ALTER TABLE public.event_payment_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY payment_schedule_read ON public.event_payment_schedule
 FOR SELECT TO authenticated USING(
   (SELECT app_private.is_staff())
   OR EXISTS(SELECT 1 FROM public.events e
     WHERE e.id=event_id AND e.client_id=(SELECT auth.uid()))
 );
CREATE POLICY payment_schedule_admin_insert ON public.event_payment_schedule
 FOR INSERT TO authenticated WITH CHECK((SELECT app_private.is_admin()));
CREATE POLICY payment_schedule_admin_update ON public.event_payment_schedule
 FOR UPDATE TO authenticated USING((SELECT app_private.is_admin()))
 WITH CHECK((SELECT app_private.is_admin()));
REVOKE ALL PRIVILEGES ON public.event_payment_schedule FROM anon;
REVOKE UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.event_payment_schedule FROM anon;
REVOKE DELETE,TRUNCATE,REFERENCES,TRIGGER ON public.event_payment_schedule FROM authenticated;
CREATE INDEX payment_schedule_event_idx ON public.event_payment_schedule(event_id);
CREATE INDEX payment_schedule_confirmed_by_idx ON public.event_payment_schedule(confirmed_by);

CREATE OR REPLACE FUNCTION public.guard_payment_schedule()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
BEGIN
 IF TG_OP='UPDATE' THEN
  IF NEW.id IS DISTINCT FROM OLD.id
    OR NEW.event_id IS DISTINCT FROM OLD.event_id
    OR NEW.label IS DISTINCT FROM OLD.label
    OR NEW.amount_eur IS DISTINCT FROM OLD.amount_eur
    OR NEW.due_on IS DISTINCT FROM OLD.due_on
    OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Payment amount and event cannot be edited; append a new record'
      USING ERRCODE='42501';
  END IF;
  IF OLD.status='received' AND NEW IS DISTINCT FROM OLD THEN
    RAISE EXCEPTION 'Received payment records are immutable'
      USING ERRCODE='42501';
  END IF;
  IF OLD.status='pending' AND NEW.status='received'
     AND NEW.confirmed_by IS DISTINCT FROM auth.uid() THEN
     RAISE EXCEPTION 'Payment confirmation must identify authenticated administrator'
       USING ERRCODE='42501';
  END IF;
 END IF;
 RETURN NEW;
END $body$;
CREATE TRIGGER guard_payment_schedule BEFORE UPDATE ON public.event_payment_schedule
 FOR EACH ROW EXECUTE FUNCTION public.guard_payment_schedule();

