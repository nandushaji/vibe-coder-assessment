-- Core application tables (refunds + maintenance).

create extension if not exists "pgcrypto";

create table if not exists public.refunds (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null,
  booking_reference text not null,
  booking_date timestamptz not null,
  refund_reason text not null,
  additional_details text,
  file_url text,
  created_at timestamptz not null default now()
);

create table if not exists public.maintenance_tickets (
  id uuid primary key default gen_random_uuid(),
  ticket_number text not null unique,
  property text not null,
  category text not null,
  urgency text not null,
  description text not null,
  photo_url text,
  status text not null default 'Open',
  created_at timestamptz not null default now()
);

create index if not exists maintenance_tickets_created_at_idx
  on public.maintenance_tickets (created_at desc);

notify pgrst, 'reload schema';
