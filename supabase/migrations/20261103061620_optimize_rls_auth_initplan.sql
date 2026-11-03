-- Cache stable auth results per statement instead of once per row.
-- All predicates retain the original client/staff access semantics.
ALTER POLICY profiles_read ON public.profiles
  USING(id=(SELECT auth.uid()) OR (SELECT app_private.is_staff()));
ALTER POLICY events_read ON public.events
  USING(client_id=(SELECT auth.uid()) OR (SELECT app_private.is_staff()));
ALTER POLICY messages_read ON public.event_messages
  USING(EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id
    AND (e.client_id=(SELECT auth.uid()) OR (SELECT app_private.is_staff()))));
ALTER POLICY messages_insert ON public.event_messages
  WITH CHECK(author_id=(SELECT auth.uid())
    AND EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id
      AND (e.client_id=(SELECT auth.uid()) OR (SELECT app_private.is_staff()))));
ALTER POLICY tasks_read ON public.event_tasks
  USING(EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id
    AND (e.client_id=(SELECT auth.uid()) OR (SELECT app_private.is_staff()))));
ALTER POLICY notifications_read ON public.notifications
  USING(recipient_id=(SELECT auth.uid()) OR (SELECT app_private.is_admin()));
ALTER POLICY notifications_mark_read ON public.notifications
  USING(recipient_id=(SELECT auth.uid()))
  WITH CHECK(recipient_id=(SELECT auth.uid()));
ALTER POLICY request_read ON public.event_change_requests
  USING(EXISTS(SELECT 1 FROM public.events e WHERE e.id=event_id
    AND (e.client_id=(SELECT auth.uid()) OR (SELECT app_private.is_staff()))));
ALTER POLICY request_client_insert ON public.event_change_requests
  WITH CHECK(requester_id=(SELECT auth.uid()) AND status='pending'
   AND reviewed_at IS NULL
   AND EXISTS(SELECT 1 FROM public.events e
     WHERE e.id=event_id AND e.client_id=(SELECT auth.uid())));
ALTER POLICY contracts_team_or_client_read ON public.event_contracts
  USING((SELECT app_private.is_staff())
    OR (state IN ('sent','signed') AND EXISTS(
      SELECT 1 FROM public.events e
       WHERE e.id=event_id AND e.client_id=(SELECT auth.uid()))));
ALTER POLICY document_metadata_read ON public.event_documents
  USING((SELECT app_private.is_staff()) OR (
    EXISTS(SELECT 1 FROM public.events e
      WHERE e.id=event_id AND e.client_id=(SELECT auth.uid()))
    AND (kind IN ('quotation','other') OR
      (kind='contract' AND EXISTS(SELECT 1 FROM public.event_contracts c
        WHERE c.document_id=event_documents.id AND c.event_id=event_documents.event_id
        AND c.state IN ('sent','signed'))))
  ));

