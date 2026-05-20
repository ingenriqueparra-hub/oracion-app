-- Tabla de invitaciones de administrador de iglesia
create table admin_invites (
  id         uuid primary key default gen_random_uuid(),
  token      uuid default gen_random_uuid() unique not null,
  church_id  uuid references churches(id) on delete cascade not null,
  created_by uuid references profiles(id) not null,
  used_by    uuid references profiles(id),
  expires_at timestamptz not null default now() + interval '24 hours',
  used_at    timestamptz,
  created_at timestamptz default now()
);

alter table admin_invites enable row level security;

-- church_admin (de esa iglesia) y super_admin pueden crear invitaciones
create policy "admins can insert invites"
on admin_invites for insert
to authenticated
with check (
  exists (
    select 1 from profiles
    where id = auth.uid()
    and (role = 'super_admin' or (role = 'church_admin' and church_id = admin_invites.church_id))
  )
);

-- cualquier usuario autenticado puede leer por token (para validar)
create policy "anyone can read invite by token"
on admin_invites for select
to authenticated
using (true);

-- el sistema puede marcar como usado
create policy "system can update invite"
on admin_invites for update
to authenticated
using (true);
