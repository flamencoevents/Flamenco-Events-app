-- Enforce message limits on the database, not only in the browser.
ALTER TABLE public.event_messages
 ADD CONSTRAINT event_messages_content_length
 CHECK(char_length(btrim(message)) BETWEEN 1 AND 3000);

CREATE INDEX IF NOT EXISTS event_messages_author_recent_idx
 ON public.event_messages(author_id,created_at DESC);

CREATE OR REPLACE FUNCTION public.limit_event_message_frequency()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path=''
AS $body$
DECLARE recent_count integer;
BEGIN
  -- Serialize rapid parallel submissions from the same sender.
  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.author_id::text,71237));
  SELECT count(*) INTO recent_count FROM public.event_messages
   WHERE author_id=NEW.author_id
     AND created_at >= clock_timestamp()-interval '1 minute';
  IF recent_count>=15 THEN
    RAISE EXCEPTION 'Message rate limit exceeded; try again later'
      USING ERRCODE='23514';
  END IF;
  RETURN NEW;
END $body$;
REVOKE ALL ON FUNCTION public.limit_event_message_frequency() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER limit_event_message_frequency
 BEFORE INSERT ON public.event_messages
 FOR EACH ROW EXECUTE FUNCTION public.limit_event_message_frequency();
