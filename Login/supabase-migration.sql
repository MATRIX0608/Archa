-- Run this only if your existing public.users table was created earlier
-- and is still empty. It adds the constraints needed by the new backend.

alter table public.users
  alter column firebase_uid set not null,
  alter column name set not null,
  alter column email set not null;

create unique index if not exists users_firebase_uid_key
  on public.users (firebase_uid);

create unique index if not exists users_email_key
  on public.users (email);
