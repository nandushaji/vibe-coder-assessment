-- Staff review workflow: pending → accepted | rejected

alter table public.refunds
  add column if not exists review_status text not null default 'pending';

alter table public.refunds
  drop constraint if exists refunds_review_status_check;

alter table public.refunds
  add constraint refunds_review_status_check
  check (review_status in ('pending', 'accepted', 'rejected'));

create index if not exists refunds_review_status_idx
  on public.refunds (review_status);

notify pgrst, 'reload schema';
