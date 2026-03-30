-- Required when using the publishable (anon) API key from server actions.
-- Service role bypasses RLS and does not need these policies.

alter table public.refunds enable row level security;
alter table public.maintenance_tickets enable row level security;

drop policy if exists "refunds_anon_insert" on public.refunds;
create policy "refunds_anon_insert"
  on public.refunds
  for insert
  to anon
  with check (true);

drop policy if exists "maintenance_anon_select" on public.maintenance_tickets;
create policy "maintenance_anon_select"
  on public.maintenance_tickets
  for select
  to anon
  using (true);

drop policy if exists "maintenance_anon_insert" on public.maintenance_tickets;
create policy "maintenance_anon_insert"
  on public.maintenance_tickets
  for insert
  to anon
  with check (true);

drop policy if exists "maintenance_anon_update" on public.maintenance_tickets;
create policy "maintenance_anon_update"
  on public.maintenance_tickets
  for update
  to anon
  using (true)
  with check (true);

drop policy if exists "refund_evidence_anon_insert" on storage.objects;
create policy "refund_evidence_anon_insert"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'refund-evidence');

drop policy if exists "maintenance_photos_anon_insert" on storage.objects;
create policy "maintenance_photos_anon_insert"
  on storage.objects
  for insert
  to anon
  with check (bucket_id = 'maintenance-photos');

notify pgrst, 'reload schema';
