"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { PHOTO_BUCKET } from "@/lib/supabase/config";
import { getSupabaseSessionClient } from "@/lib/supabase/session";
import { RATIO_VALUES } from "@/lib/ratios";

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
    if (!RATIO_VALUES.includes(patch.ratio)) {
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
