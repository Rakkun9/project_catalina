-- ---------------------------------------------------------------------------
-- Project Catalina — esquema de fotografía
-- Ejecutar en el SQL Editor de Supabase. Es idempotente: se puede volver a
-- correr sobre una base ya creada para aplicar los cambios del panel.
-- ---------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- Categorías -------------------------------------------------------------------
create table if not exists public.collections (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,
  title       text not null,
  description text,
  position    integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Fotos -----------------------------------------------------------------------
create table if not exists public.photos (
  id            uuid primary key default gen_random_uuid(),
  collection_id uuid references public.collections (id) on delete set null,

  label         text not null,               -- izquierda del pie de la tarjeta
  meta          text,                        -- derecha: "Editorial · 24"
  alt           text,                        -- texto alternativo
  storage_path  text not null,               -- ruta dentro del bucket `photos`

  -- proporción del marco: define el alto de la tarjeta en la grilla.
  -- Se propone a partir de width/height al subir, pero es editable: el marco
  -- puede recortar distinto al original a propósito (PhotoTile usa object-cover).
  ratio         text not null default '4 / 5',

  -- dimensiones reales del archivo original, en píxeles
  width         integer,
  height        integer,

  published     boolean  not null default true,
  position      integer  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Columnas agregadas después de la primera versión del esquema
alter table public.photos add column if not exists width      integer;
alter table public.photos add column if not exists height     integer;
alter table public.photos add column if not exists updated_at timestamptz not null default now();

create index if not exists photos_collection_idx on public.photos (collection_id);
create index if not exists photos_order_idx on public.photos (position);

-- updated_at automático --------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists photos_touch_updated_at on public.photos;
create trigger photos_touch_updated_at
  before update on public.photos
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- Lectura: pública, sólo lo publicado.
-- Escritura: sólo usuarios autenticados.
--
-- ⚠ Estas políticas habilitan a CUALQUIER usuario autenticado. Eso es correcto
--   únicamente porque el registro público está deshabilitado y los usuarios se
--   crean a mano desde el dashboard. Para endurecerlo con varias personas:
--   crear una tabla `admins (user_id uuid primary key)` y reemplazar
--   `to authenticated using (true)` por
--   `using (exists (select 1 from public.admins a where a.user_id = auth.uid()))`.
-- ---------------------------------------------------------------------------
alter table public.collections enable row level security;
alter table public.photos      enable row level security;

-- Lectura pública
drop policy if exists "collections are public" on public.collections;
create policy "collections are public"
  on public.collections for select
  using (true);

drop policy if exists "published photos are public" on public.photos;
create policy "published photos are public"
  on public.photos for select
  using (published = true);

-- El panel necesita ver también los borradores. Las políticas de select se
-- combinan con OR, así que esta se suma a la pública sin reemplazarla.
drop policy if exists "authenticated read all photos" on public.photos;
create policy "authenticated read all photos"
  on public.photos for select to authenticated
  using (true);

-- Escritura
drop policy if exists "authenticated write photos" on public.photos;
create policy "authenticated write photos"
  on public.photos for insert to authenticated
  with check (true);

drop policy if exists "authenticated update photos" on public.photos;
create policy "authenticated update photos"
  on public.photos for update to authenticated
  using (true) with check (true);

drop policy if exists "authenticated delete photos" on public.photos;
create policy "authenticated delete photos"
  on public.photos for delete to authenticated
  using (true);

drop policy if exists "authenticated write collections" on public.collections;
create policy "authenticated write collections"
  on public.collections for all to authenticated
  using (true) with check (true);

-- ---------------------------------------------------------------------------
-- OPCIONAL — restringir la escritura a una lista de administradores.
--
-- Las políticas de arriba habilitan a cualquier usuario autenticado, lo cual
-- SÓLO es seguro con el registro público deshabilitado
-- (Authentication → Sign In / Providers → "Allow new users to sign up": off).
--
-- Si preferís no depender de ese interruptor, descomentá este bloque: mueve la
-- validación a la base, y entonces da igual quién se pueda registrar.
--
--   1. Descomentá y ejecutá lo que sigue.
--   2. Copiá el UUID de tu usuario desde Authentication → Users.
--   3. insert into public.admins (user_id) values ('<tu-uuid>');
--
-- create table if not exists public.admins (
--   user_id uuid primary key references auth.users (id) on delete cascade
-- );
-- alter table public.admins enable row level security;
--
-- create or replace function public.is_admin()
-- returns boolean language sql stable security definer set search_path = public as $$
--   select exists (select 1 from public.admins a where a.user_id = auth.uid());
-- $$;
--
-- drop policy if exists "authenticated read all photos"   on public.photos;
-- drop policy if exists "authenticated write photos"      on public.photos;
-- drop policy if exists "authenticated update photos"     on public.photos;
-- drop policy if exists "authenticated delete photos"     on public.photos;
-- drop policy if exists "authenticated write collections" on public.collections;
--
-- create policy "admins read all photos" on public.photos
--   for select to authenticated using (public.is_admin());
-- create policy "admins write photos" on public.photos
--   for insert to authenticated with check (public.is_admin());
-- create policy "admins update photos" on public.photos
--   for update to authenticated using (public.is_admin()) with check (public.is_admin());
-- create policy "admins delete photos" on public.photos
--   for delete to authenticated using (public.is_admin());
-- create policy "admins write collections" on public.collections
--   for all to authenticated using (public.is_admin()) with check (public.is_admin());
--
-- drop policy if exists "authenticated upload photo objects" on storage.objects;
-- drop policy if exists "authenticated delete photo objects" on storage.objects;
-- create policy "admins upload photo objects" on storage.objects
--   for insert to authenticated with check (bucket_id = 'photos' and public.is_admin());
-- create policy "admins delete photo objects" on storage.objects
--   for delete to authenticated using (bucket_id = 'photos' and public.is_admin());
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- Reordenar en una sola sentencia.
-- `security invoker` es deliberado: la función corre con los permisos de quien
-- la llama, así que RLS se sigue aplicando y un anónimo no puede reordenar.
-- ---------------------------------------------------------------------------
create or replace function public.reorder_photos(ids uuid[])
returns void
language sql
security invoker
as $$
  update public.photos p
     set position = idx.ord
    from unnest(ids) with ordinality as idx(id, ord)
   where p.id = idx.id;
$$;

-- Mismo criterio para las categorías.
create or replace function public.reorder_collections(ids uuid[])
returns void
language sql
security invoker
as $$
  update public.collections c
     set position = idx.ord
    from unnest(ids) with ordinality as idx(id, ord)
   where c.id = idx.id;
$$;

-- ---------------------------------------------------------------------------
-- Storage
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photo objects are public" on storage.objects;
create policy "photo objects are public"
  on storage.objects for select
  using (bucket_id = 'photos');

drop policy if exists "authenticated upload photo objects" on storage.objects;
create policy "authenticated upload photo objects"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'photos');

drop policy if exists "authenticated delete photo objects" on storage.objects;
create policy "authenticated delete photo objects"
  on storage.objects for delete to authenticated
  using (bucket_id = 'photos');

-- ---------------------------------------------------------------------------
-- Datos iniciales (mismas categorías que los placeholders)
-- ---------------------------------------------------------------------------
insert into public.collections (slug, title, description, position) values
  ('editorial',    'Editorial',    'Encargos para revistas y estudios de diseño.', 1),
  ('portrait',     'Portrait',     'Retratos a luz natural, sin dirección.',       2),
  ('architecture', 'Architecture', 'Volúmenes, sombra dura y repetición.',         3),
  ('still-life',   'Still life',   'Objetos cotidianos, mesa y ventana.',          4)
on conflict (slug) do nothing;
