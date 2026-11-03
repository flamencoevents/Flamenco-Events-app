-- Cover commonly used foreign keys, especially event ownership and notification lookup.
CREATE INDEX IF NOT EXISTS enquiry_audit_enquiry_id_idx ON public.enquiry_audit(enquiry_id);
CREATE INDEX IF NOT EXISTS event_change_requests_requester_id_idx ON public.event_change_requests(requester_id);
CREATE INDEX IF NOT EXISTS event_contracts_document_id_idx ON public.event_contracts(document_id);
CREATE INDEX IF NOT EXISTS event_messages_author_id_idx ON public.event_messages(author_id);
CREATE INDEX IF NOT EXISTS event_tasks_event_id_idx ON public.event_tasks(event_id);
CREATE INDEX IF NOT EXISTS events_client_id_idx ON public.events(client_id);
CREATE INDEX IF NOT EXISTS notifications_event_id_idx ON public.notifications(event_id);

-- Preserve admin-only deletion; other task operations already cover staff, including admin.
DROP POLICY IF EXISTS tasks_admin_write ON public.event_tasks;
CREATE POLICY tasks_admin_delete ON public.event_tasks FOR DELETE TO authenticated
 USING((SELECT public.is_admin()));

-- An administrator is a member of staff; this SELECT/UPDATE policy
-- already includes the administrator, without a duplicated permissive policy.
DROP POLICY IF EXISTS events_admin_update ON public.events;

