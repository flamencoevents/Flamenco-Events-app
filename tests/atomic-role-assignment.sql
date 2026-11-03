BEGIN;
INSERT INTO auth.users(id,email) VALUES
('a0000000-0000-4000-8000-000000000051','fe-test-atomic-admin@example.invalid'),
('b0000000-0000-4000-8000-000000000052','fe-test-atomic-target@example.invalid');
INSERT INTO public.profiles(id,role) VALUES
('a0000000-0000-4000-8000-000000000051','admin'),
('b0000000-0000-4000-8000-000000000052','client');
SET LOCAL ROLE authenticated;
DO $test$ DECLARE prevented boolean:=false; BEGIN
 BEGIN
  PERFORM public.assign_sales_role_atomic(
   'a0000000-0000-4000-8000-000000000051',
   'b0000000-0000-4000-8000-000000000052','sales');
 EXCEPTION WHEN insufficient_privilege THEN prevented:=true;
 END;
 IF NOT prevented THEN RAISE EXCEPTION 'Authenticated user can invoke privileged RPC'; END IF;
END $test$;
RESET ROLE;
SET LOCAL ROLE service_role;
DO $test$ DECLARE result text; audit_count integer; BEGIN
 SELECT public.assign_sales_role_atomic(
   'a0000000-0000-4000-8000-000000000051',
   'b0000000-0000-4000-8000-000000000052','sales') INTO result;
 IF result<>'changed' THEN RAISE EXCEPTION 'Atomic role update not applied'; END IF;
 SELECT count(*) INTO audit_count FROM public.role_change_audit WHERE target_id='b0000000-0000-4000-8000-000000000052';
 IF audit_count<>1 THEN RAISE EXCEPTION 'Audit trail missing'; END IF;
 SELECT public.assign_sales_role_atomic(
   'a0000000-0000-4000-8000-000000000051',
   'b0000000-0000-4000-8000-000000000052','sales') INTO result;
 IF result<>'unchanged' THEN RAISE EXCEPTION 'Idempotent repeat failed'; END IF;
 SELECT count(*) INTO audit_count FROM public.role_change_audit WHERE target_id='b0000000-0000-4000-8000-000000000052';
 IF audit_count<>1 THEN RAISE EXCEPTION 'Duplicate audit record'; END IF;
END $test$;
RESET ROLE;
ROLLBACK;
SELECT 'Atomic role assignment passed; transaction rolled back' AS result;