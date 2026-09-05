"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PHOTO_BUCKET } from "@/lib/supabase/config";
import { getSupabaseSessionClient } from "@/lib/supabase/session";
import { exactRatio, isValidRatio } from "@/lib/ratios";
import { slugify } from "@/lib/slug";

export type ActionResult = { ok: boolean; message: string };

/**
 * Cliente con sesión verificada. `getUser()` habla con el servidor de Auth en
 * vez de confiar en la cookie, que el cliente puede falsificar.
 */
async function requireSession() {
  const supabase = await getSupabaseSessionClient();
  if (!supabase) return { supabase: null, error: "Supabase no está configurado." } as const;

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) {
    return { supabase: null, error: "Tu sesión expiró. Volvé a entrar." } as const;
  }
  return { supabase, error: null } as const;
}

/** Refresca el sitio público y el panel después de cualquier escritura. */
function revalidateEverything() {
  revalidatePath("/", "layout");
}

export type PhotoPatch = {
  label?: string;
  meta?: string | null;
  alt?: string | null;
  ratio?: string;
  collectionId?: string | null;
  published?: boolean;
};

export async function updatePhoto(id: string, patch: PhotoPatch): Promise<ActionResult> {
  const { supabase, error } = await requireSession();
  if (!supabase) return { ok: false, message: error };

  const update: Record<string, unknown> = {};

  if (patch.label !== undefined) {
    const label = patch.label.trim();
    if (!label) return { ok: false, message: "El label no puede quedar vacío." };
    update.label = label;
  }
  if (patch.meta !== undefined) update.meta = patch.meta?.trim() || null;
  if (patch.alt !== undefined) update.alt = patch.alt?.trim() || null;
  if (patch.published !== undefined) update.published = patch.published;
  if (patch.collectionId !== undefined) update.collection_id = patch.collectionId || null;

  if (patch.ratio !== undefined) {
    // Ya no se valida contra la lista de presets: la proporción por defecto es
    // la exacta de cada foto, que casi nunca coincide con un preset.
    if (!isValidRatio(patch.ratio)) {
      return { ok: false, message: "Proporción no válida." };
    }
    update.ratio = patch.ratio;
  }

  if (Object.keys(update).length === 0) return { ok: true, message: "Sin cambios." };

  const { error: updateError } = await supabase.from("photos").update(update).eq("id", id);
  if (updateError) return { ok: false, message: updateError.message };

  revalidateEverything();
  return { ok: true, message: "Guardado." };
}

/**
 * Borra la fila y después el objeto del bucket. En ese orden a propósito: si
 * falla el borrado del archivo queda un huérfano invisible, que es molesto pero
 * inofensivo; al revés quedaría una tarjeta apuntando a una imagen inexistente.
 */
export async function deletePhoto(id: string): Promise<ActionResult> {
  const { supabase, error } = await requireSession();
  if (!supabase) return { ok: false, message: error };

  const { data: row, error: readError } = await supabase
    .from("photos")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  if (readError) return { ok: false, message: readError.message };
  if (!row) return { ok: false, message: "La foto ya no existe." };

  const { error: deleteError } = await supabase.from("photos").delete().eq("id", id);
  if (deleteError) return { ok: false, message: deleteError.message };

  const storagePath = (row as { storage_path: string | null }).storage_path;
  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from(PHOTO_BUCKET)
      .remove([storagePath]);

    if (storageError) {
      revalidateEverything();
      return {
        ok: true,
        message: `Se borró la ficha, pero el archivo quedó en el bucket: ${storageError.message}`,
      };
    }
  }

  revalidateEverything();
  return { ok: true, message: "Foto borrada." };
}

/** Escribe `position` según el orden del array, en una sola sentencia. */
export async function reorderPhotos(ids: string[]): Promise<ActionResult> {
  const { supabase, error } = await requireSession();
  if (!supabase) return { ok: false, message: error };
  if (!ids.length) return { ok: true, message: "Sin cambios." };

  const { error: rpcError } = await supabase.rpc("reorder_photos", { ids });
  if (rpcError) return { ok: false, message: rpcError.message };

  revalidateEverything();
  return { ok: true, message: "Orden guardado." };
}

export async function signOut() {
  const supabase = await getSupabaseSessionClient();
  await supabase?.auth.signOut();
  revalidateEverything();
  redirect("/login");
}

/**
 * Devuelve todas las fotos a su proporción exacta, quitando el recorte.
 *
 * Existe porque las fotos cargadas antes de este cambio quedaron ajustadas a un
 * preset: una 3:2 guardada como "4 / 5" pierde casi la mitad de la imagen.
 * Sólo toca las que tienen dimensiones y no coinciden ya con su original.
 */
export async function resetRatiosToOriginal(): Promise<ActionResult> {
  const { supabase, error } = await requireSession();
  if (!supabase) return { ok: false, message: error };

  const { data, error: readError } = await supabase
    .from("photos")
    .select("id, ratio, width, height")
    .not("width", "is", null)
    .not("height", "is", null);

  if (readError) return { ok: false, message: readError.message };

  const rows = (data ?? []) as { id: string; ratio: string; width: number; height: number }[];

  const stale: { id: string; ratio: string }[] = [];
  for (const row of rows) {
    const original = exactRatio(row.width, row.height);
    if (original !== row.ratio) stale.push({ id: row.id, ratio: original });
  }

  if (!stale.length) {
    return { ok: true, message: "Todas las fotos ya usan su proporción original." };
  }

  for (const row of stale) {
    const { error: updateError } = await supabase
      .from("photos")
      .update({ ratio: row.ratio })
      .eq("id", row.id);
    if (updateError) return { ok: false, message: updateError.message };
  }

  revalidateEverything();
  return {
    ok: true,
    message: `${stale.length} ${stale.length === 1 ? "foto ajustada" : "fotos ajustadas"} a su proporción original.`,
  };
}

/* ------------------------------------------------------------------ *
 * Categorías
 * ------------------------------------------------------------------ */

export type CollectionPatch = { title?: string; slug?: string; description?: string | null };

export async function createCollection(
  title: string,
  description: string,
): Promise<ActionResult> {
  const { supabase, error } = await requireSession();
  if (!supabase) return { ok: false, message: error };

  const clean = title.trim();
  if (!clean) return { ok: false, message: "El nombre no puede quedar vacío." };

  const slug = slugify(clean);
  if (!slug) return { ok: false, message: "El nombre no produce una URL válida." };

  // Nueva categoría al final del orden actual.
  const { data: last } = await supabase
    .from("collections")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: insertError } = await supabase.from("collections").insert({
    title: clean,
    slug,
    description: description.trim() || null,
    position: ((last as { position: number } | null)?.position ?? 0) + 1,
  });

  if (insertError) {
    // 23505 = unique_violation sobre `slug`.
    if (insertError.code === "23505") {
      return { ok: false, message: `Ya existe una categoría con la URL "${slug}".` };
    }
    return { ok: false, message: insertError.message };
  }

  revalidateEverything();
  return { ok: true, message: `Categoría "${clean}" creada.` };
}

export async function updateCollection(
  id: string,
  patch: CollectionPatch,
): Promise<ActionResult> {
  const { supabase, error } = await requireSession();
  if (!supabase) return { ok: false, message: error };

  const update: Record<string, unknown> = {};

  if (patch.title !== undefined) {
    const title = patch.title.trim();
    if (!title) return { ok: false, message: "El nombre no puede quedar vacío." };
    update.title = title;
  }

  if (patch.slug !== undefined) {
    const slug = slugify(patch.slug);
    if (!slug) return { ok: false, message: "La URL no es válida." };
    update.slug = slug;
  }

  if (patch.description !== undefined) {
    update.description = patch.description?.trim() || null;
  }

  if (Object.keys(update).length === 0) return { ok: true, message: "Sin cambios." };

  const { error: updateError } = await supabase
    .from("collections")
    .update(update)
    .eq("id", id);

  if (updateError) {
    if (updateError.code === "23505") {
      return { ok: false, message: "Ya existe otra categoría con esa URL." };
    }
    return { ok: false, message: updateError.message };
  }

  revalidateEverything();
  return { ok: true, message: "Guardado." };
}

/**
 * Borra la categoría. Las fotos NO se borran: la clave foránea está declarada
 * `on delete set null`, así que quedan sin categoría y se pueden reasignar.
 */
export async function deleteCollection(id: string): Promise<ActionResult> {
  const { supabase, error } = await requireSession();
  if (!supabase) return { ok: false, message: error };

  const { count } = await supabase
    .from("photos")
    .select("id", { count: "exact", head: true })
    .eq("collection_id", id);

  const { error: deleteError } = await supabase.from("collections").delete().eq("id", id);
  if (deleteError) return { ok: false, message: deleteError.message };

  revalidateEverything();
  return {
    ok: true,
    message: count
      ? `Categoría borrada. ${count} ${count === 1 ? "foto quedó" : "fotos quedaron"} sin categoría.`
      : "Categoría borrada.",
  };
}

export async function reorderCollections(ids: string[]): Promise<ActionResult> {
  const { supabase, error } = await requireSession();
  if (!supabase) return { ok: false, message: error };
  if (!ids.length) return { ok: true, message: "Sin cambios." };

  const { error: rpcError } = await supabase.rpc("reorder_collections", { ids });
  if (rpcError) return { ok: false, message: rpcError.message };

  revalidateEverything();
  return { ok: true, message: "Orden guardado." };
}
