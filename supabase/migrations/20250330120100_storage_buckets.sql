-- Public buckets for guest evidence uploads (5 MB cap; URLs work with getPublicUrl).

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('refund-evidence', 'refund-evidence', true, 5242880, null),
  ('maintenance-photos', 'maintenance-photos', true, 5242880, null)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit;
