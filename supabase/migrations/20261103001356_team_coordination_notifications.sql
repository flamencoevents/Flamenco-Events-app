-- Commercial coordination: only staff can edit non-financial event planning.
-- Column-level grants prevent changing client ownership, contract links or booking status.
REVOKE UPDATE ON TABLE public.events FROM authenticated;
GRANT UPDATE (wardrobe,repertoire,schedule_notes,onsite_contact,venue) ON public.events TO authenticated;
CREATE POLICY events_team_coordinate ON public.events
FOR UPDATE TO authenticated
USING (public.is_staff())
WITH CHECK (public.is_staff());

-- Team can organize event tasks, clients can only view.
DROP POLICY IF EXISTS tasks_team_insert ON public.event_tasks;
CREATE POLICY tasks_team_insert ON public.event_tasks FOR INSERT TO authenticated
WITH CHECK (public.is_staff());
DROP POLICY IF EXISTS tasks_team_update ON public.event_tasks;
CREATE POLICY tasks_team_update ON public.event_tasks FOR UPDATE TO authenticated
USING (public.is_staff()) WITH CHECK (public.is_staff());

-- Safe notification inbox; no clients can spoof a staff notification.
CREATE TABLE IF NOT EXISTS public.notifications(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
 event_id uuid REFERENCES public.events(id) ON DELETE CASCADE,
 category text NOT NULL CHECK(category IN ('message','request','contract','schedule','document','event')),
 body text NOT NULL CHECK(length(body) BETWEEN 1 AND 500),
 read_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_read ON public.notifications FOR SELECT TO authenticated USING(recipient_id=auth.uid() OR public.is_admin());
CREATE POLICY notifications_mark_read ON public.notifications FOR UPDATE TO authenticated USING(recipient_id=auth.uid()) WITH CHECK(recipient_id=auth.uid());
-- Only trusted backend/admin adds notifications, never a client.
CREATE POLICY notifications_admin_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK(public.is_admin());

CREATE INDEX IF NOT EXISTS notifications_recipient_unread ON public.notifications(recipient_id,created_at DESC) WHERE read_at IS NULL;

