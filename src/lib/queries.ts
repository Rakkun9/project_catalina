import { placeholderCollections, placeholderPhotos } from "./placeholder-data";
import { getSupabaseReadClient } from "./supabase/server";
import { getSupabaseSessionClient } from "./supabase/session";
import { PHOTO_BUCKET } from "./supabase/config";
import { DEFAULT_RATIO } from "./ratios";
import type { AdminPhoto, Collection, Photo } from "./types";

/** Row shapes as they come back from Postgres (snake_case). */
type CollectionRow = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  position: number;
};

type PhotoRow = {
  id: string;
  label: string;
  meta: string | null;
  storage_path: string | null;
  alt: string | null;
  ratio: string | null;
  position: number | null;
  collections: { slug: string } | null;
};

/** Sólo el select del panel trae estas columnas. */
type AdminPhotoRow = PhotoRow & {
  published: boolean | null;
  width: number | null;
  height: number | null;
  collection_id: string | null;
};

function toCollection(row: CollectionRow): Collection {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    position: row.position ?? 0,
  };
}

function toPhoto(row: PhotoRow, publicUrl: (path: string) => string): Photo {
  return {
    id: row.id,
    label: row.label,
    meta: row.meta,
    src: row.storage_path ? publicUrl(row.storage_path) : null,
    alt: row.alt ?? row.label,
    collectionSlug: row.collections?.slug ?? null,
    ratio: row.ratio ?? DEFAULT_RATIO,
    position: row.position ?? 0,
  };
}

/**
 * El sitio público pide sólo lo que dibuja. Mantenerlo separado del select del
 * panel evita que una migración pendiente en la base tire la home entera a los
 * placeholders por una columna que la home ni siquiera usa.
 */
const PHOTO_SELECT_PUBLIC =
  "id, label, meta, storage_path, alt, ratio, position, collections(slug)";

const PHOTO_SELECT_ADMIN = `${PHOTO_SELECT_PUBLIC}, published, width, height, collection_id`;

/** URL pública de un objeto del bucket. */
export function photoPublicUrl(
  supabase: NonNullable<ReturnType<typeof getSupabaseReadClient>>,
  path: string,
): string {
  return supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;
}

export async function getCollections(): Promise<Collection[]> {
  const supabase = getSupabaseReadClient();
  if (!supabase) return placeholderCollections;

  const { data, error } = await supabase
    .from("collections")
    .select("id, slug, title, description, position")
    .order("position", { ascending: true });

  if (error) {
    console.warn("[catalina] collections query failed, using placeholders:", error.message);
    return placeholderCollections;
  }
  if (!data?.length) return placeholderCollections;

  return (data as CollectionRow[]).map(toCollection);
}

export async function getPhotos(collectionSlug?: string): Promise<Photo[]> {
  const supabase = getSupabaseReadClient();
  if (!supabase) return filterPlaceholders(collectionSlug);

  // `collections(slug)` es un left join: filtrar por `collections.slug` sobre él
  // filtra la relación embebida, no las fotos, y devuelve TODAS las fotos con
  // `collections: null`. `!inner` lo convierte en inner join, que es lo que
  // realmente descarta las filas de otras categorías.
  const select = collectionSlug
    ? PHOTO_SELECT_PUBLIC.replace("collections(slug)", "collections!inner(slug)")
    : PHOTO_SELECT_PUBLIC;

  let query = supabase
    .from("photos")
    .select(select)
    .eq("published", true)
    .order("position", { ascending: true });

  if (collectionSlug) query = query.eq("collections.slug", collectionSlug);

  const { data, error } = await query;

  if (error) {
    console.warn("[catalina] photos query failed, using placeholders:", error.message);
    return filterPlaceholders(collectionSlug);
  }
  if (!data?.length) return filterPlaceholders(collectionSlug);

  const publicUrl = (path: string) => photoPublicUrl(supabase, path);
  return (data as unknown as PhotoRow[]).map((row) => toPhoto(row, publicUrl));
}

export async function getCollection(slug: string): Promise<Collection | null> {
  const all = await getCollections();
  return all.find((c) => c.slug === slug) ?? null;
}

function filterPlaceholders(collectionSlug?: string): Photo[] {
  if (!collectionSlug) return placeholderPhotos;
  return placeholderPhotos.filter((p) => p.collectionSlug === collectionSlug);
}

/* ------------------------------------------------------------------ *
 * Panel de administración
 * ------------------------------------------------------------------ */

/**
 * Todas las fotos, incluidos los borradores. Va por el cliente ligado a la
 * sesión: la política pública filtra `published = true`, así que sin sesión
 * esta consulta simplemente no devuelve los borradores.
 *
 * Nunca cae a los placeholders — el panel debe mostrar el estado real de la
 * base, aunque esté vacía.
 */
export async function getAdminPhotos(): Promise<AdminPhoto[]> {
  const supabase = await getSupabaseSessionClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("photos")
    .select(PHOTO_SELECT_ADMIN)
    .order("position", { ascending: true });

  if (error) {
    console.error("[catalina] admin photos query failed:", error.message);
    return [];
  }

  const rows = (data ?? []) as unknown as AdminPhotoRow[];

  return rows.map((row) => ({
    ...toPhoto(row, (path) => photoPublicUrl(supabase, path)),
    collectionId: row.collection_id,
    published: row.published ?? false,
    storagePath: row.storage_path,
    width: row.width,
    height: row.height,
  }));
}

/** Categorías reales de la base, sin fallback a placeholders. */
export async function getAdminCollections(): Promise<Collection[]> {
  const supabase = await getSupabaseSessionClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("collections")
    .select("id, slug, title, description, position")
    .order("position", { ascending: true });

  if (error) {
    console.error("[catalina] admin collections query failed:", error.message);
    return [];
  }

  return (data as CollectionRow[]).map(toCollection);
}
