-- Explicit separation of accepted quotation and formally confirmed reservation.
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS reservation_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reservation_review_note text;

CREATE OR REPLACE FUNCTION public.guard_formal_reservation()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
BEGIN
 IF TG_OP='INSERT' AND NEW.status IN ('confirmed','completed') THEN
   RAISE EXCEPTION 'A new event cannot start as a confirmed reservation'
     USING ERRCODE='23514';
 END IF;
 IF TG_OP='UPDATE' AND NEW.status='completed'
    AND OLD.status IS DISTINCT FROM 'confirmed'
    AND OLD.status IS DISTINCT FROM 'completed' THEN
   RAISE EXCEPTION 'Only confirmed reservations can be completed'
     USING ERRCODE='23514';
 END IF;
 IF NEW.status='confirmed' AND (
    NEW.reservation_reviewed_at IS NULL
    OR char_length(btrim(COALESCE(NEW.reservation_review_note,''))) < 10
    OR NOT EXISTS (
       SELECT 1 FROM public.event_contracts c
       WHERE c.event_id=NEW.id AND c.state='signed' AND c.signed_at IS NOT NULL
    )
 ) THEN
   RAISE EXCEPTION 'Formal reservation requires signed contract and administrator review'
     USING ERRCODE='23514';
 END IF;
 RETURN NEW;
END $body$;
CREATE TRIGGER guard_formal_reservation
 BEFORE INSERT OR UPDATE OF status,reservation_reviewed_at,reservation_review_note ON public.events
 FOR EACH ROW EXECUTE FUNCTION public.guard_formal_reservation();

-- Avoid sales-level alteration of administrator-only confirmation evidence.
CREATE OR REPLACE FUNCTION public.protect_event_commercial_fields()
RETURNS trigger LANGUAGE plpgsql SET search_path='' AS $body$
BEGIN
 IF NOT public.is_admin() AND (
    NEW.id IS DISTINCT FROM OLD.id OR
    NEW.client_id IS DISTINCT FROM OLD.client_id OR
    NEW.enquiry_id IS DISTINCT FROM OLD.enquiry_id OR
    NEW.title IS DISTINCT FROM OLD.title OR
    NEW.event_date IS DISTINCT FROM OLD.event_date OR
    NEW.performance IS DISTINCT FROM OLD.performance OR
    NEW.status IS DISTINCT FROM OLD.status OR
    NEW.quotation_url IS DISTINCT FROM OLD.quotation_url OR
    NEW.contract_url IS DISTINCT FROM OLD.contract_url OR
    NEW.reservation_reviewed_at IS DISTINCT FROM OLD.reservation_reviewed_at OR
    NEW.reservation_review_note IS DISTINCT FROM OLD.reservation_review_note OR
    NEW.created_at IS DISTINCT FROM OLD.created_at
 ) THEN
  RAISE EXCEPTION 'Only administrators can change commercial or ownership fields'
    USING ERRCODE='42501';
 END IF;
 RETURN NEW;
END $body$;

