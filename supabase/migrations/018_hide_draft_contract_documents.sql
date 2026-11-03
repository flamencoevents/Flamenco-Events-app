-- Prevent clients from viewing draft contracts or unregistered storage objects.
DROP POLICY IF EXISTS document_metadata_read ON public.event_documents;
CREATE POLICY document_metadata_read ON public.event_documents FOR SELECT TO authenticated
USING(
 public.is_staff()
 OR (
  EXISTS(SELECT 1 FROM public.events e
         WHERE e.id=event_documents.event_id AND e.client_id=auth.uid())
  AND (
   kind IN ('quotation','other')
   OR (
    kind='contract' AND EXISTS(
     SELECT 1 FROM public.event_contracts c
      WHERE c.document_id=event_documents.id
      AND c.event_id=event_documents.event_id
      AND c.state IN ('sent','signed')
    )
   )
  )
 )
);

DROP POLICY IF EXISTS fe_documents_read ON storage.objects;
CREATE POLICY fe_documents_read ON storage.objects FOR SELECT TO authenticated
USING(
 bucket_id='event-documents'
 AND (
  public.is_staff()
  OR EXISTS(
   SELECT 1 FROM public.event_documents d
    JOIN public.events e ON e.id=d.event_id
   WHERE d.storage_path=objects.name
     AND e.client_id=auth.uid()
     AND (
       d.kind IN ('quotation','other')
       OR (d.kind='contract' AND EXISTS(
         SELECT 1 FROM public.event_contracts c
         WHERE c.document_id=d.id AND c.state IN ('sent','signed')
       ))
     )
  )
 )
);
