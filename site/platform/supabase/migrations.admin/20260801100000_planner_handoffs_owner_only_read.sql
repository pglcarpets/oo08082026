-- ---------------------------------------------------------------------------
-- planner_handoffs — restrict authenticated read to the row owner
-- ---------------------------------------------------------------------------
-- The original policy (20260731120000) read:
--
--   using (created_by is null or created_by = auth.uid())
--
-- `/api/Planner/handoff` is `role: "guest"` so anonymous submissions persist
-- `created_by = null`. The first disjunct therefore matched every such row for
-- every authenticated user, exposing the `contact` payload (customer name,
-- email, phone) and the full BOQ to any signed-in account.
--
-- Dropping the disjunct leaves unowned rows readable by `service_role` only,
-- which is where staff follow-up already happens (admin surfaces use the
-- service-role client). Guest capture is unaffected: inserts still succeed and
-- still record `created_by = null`.

drop policy if exists "planner_handoffs authenticated read own" on public.planner_handoffs;
create policy "planner_handoffs authenticated read own"
  on public.planner_handoffs
  for select
  to authenticated
  using (created_by = auth.uid());

-- rollback:
-- drop policy if exists "planner_handoffs authenticated read own" on public.planner_handoffs;
-- create policy "planner_handoffs authenticated read own"
--   on public.planner_handoffs
--   for select
--   to authenticated
--   using (created_by is null or created_by = auth.uid());
