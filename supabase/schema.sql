-- ---------------------------------------------------------------------------
-- Project Catalina — esquema de fotografía
-- Ejecutar en el SQL Editor de Supabase (una sola vez).
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

  -- proporción del marco: define el alto de la tarjeta en la grilla
  ratio         text not null default '4 / 5',

  published     boolean  not null default true,
  position      integer  not null default 0,
  created_at    timestamptz not null default now()
);

create index if not exists photos_collection_idx on public.photos (collection_id);
create index if not exists photos_order_idx on public.photos (position);

-- Row Level Security ----------------------------------------------------------
-- Lectura pública; la escritura pasa sólo por la service role key del servidor,
-- que ignora RLS. Reemplazar por políticas basadas en auth.uid() al agregar login.
alter table public.collections enable row level security;
alter table public.photos      enable row level security;

drop policy if exists "collections are public" on public.collections;
create policy "collections are public"
  on public.collections for select
  using (true);

drop policy if exists "published photos are public" on public.photos;
create policy "published photos are public"
  on public.photos for select
  using (published = true);

-- Storage ---------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

drop policy if exists "photo objects are public" on storage.objects;
create policy "photo objects are public"
  on storage.objects for select
  using (bucket_id = 'photos');

-- Datos iniciales (mismas categorías que los placeholders) ---------------------
insert into public.collections (slug, title, description, position) values
  ('editorial',    'Editorial',    'Encargos para revistas y estudios de diseño.', 1),
  ('portrait',     'Portrait',     'Retratos a luz natural, sin dirección.',       2),
  ('architecture', 'Architecture', 'Volúmenes, sombra dura y repetición.',         3),
  ('still-life',   'Still life',   'Objetos cotidianos, mesa y ventana.',          4)
on conflict (slug) do nothing;
