import { placeholderCollections, placeholderPhotos } from "./placeholder-data";
import { getSupabaseReadClient } from "./supabase/server";
import { PHOTO_BUCKET } from "./supabase/config";
import type { Collection, Photo } from "./types";

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
    ratio: row.ratio ?? "4 / 5",
    position: row.position ?? 0,
  };
}

const PHOTO_SELECT =
  "id, label, meta, storage_path, alt, ratio, position, collections(slug)";

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

  let query = supabase
    .from("photos")
    .select(PHOTO_SELECT)
    .eq("published", true)
    .order("position", { ascending: true });

  if (collectionSlug) query = query.eq("collections.slug", collectionSlug);

  const { data, error } = await query;

  if (error) {
    console.warn("[catalina] photos query failed, using placeholders:", error.message);
    return filterPlaceholders(collectionSlug);
  }
  if (!data?.length) return filterPlaceholders(collectionSlug);

  const publicUrl = (path: string) =>
    supabase.storage.from(PHOTO_BUCKET).getPublicUrl(path).data.publicUrl;

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
