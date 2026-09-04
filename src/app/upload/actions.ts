"use server";

import { revalidatePath } from "next/cache";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { PHOTO_BUCKET } from "@/lib/supabase/config";
import { RATIO_VALUES } from "./formats";

export type UploadState = { status: "idle" | "ok" | "error"; message: string };

const MAX_BYTES = 15 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/avif"];

export async function uploadPhoto(
  _prev: UploadState,
  formData: FormData,
): Promise<UploadState> {
  const accessCode = process.env.STUDIO_ACCESS_CODE;
  if (!accessCode) {
    return { status: "error", message: "Falta STUDIO_ACCESS_CODE en el entorno." };
  }
  if (formData.get("code") !== accessCode) {
    return { status: "error", message: "Código de acceso incorrecto." };
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return {
      status: "error",
      message: "Supabase no está configurado (falta URL o SUPABASE_SERVICE_ROLE_KEY).",
    };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { status: "error", message: "Elegí un archivo de imagen." };
  }
  if (!ALLOWED.includes(file.type)) {
    return { status: "error", message: "Formato no admitido: usá JPG, PNG, WebP o AVIF." };
  }
  if (file.size > MAX_BYTES) {
    return { status: "error", message: "La imagen supera los 15 MB." };
  }

  const label = String(formData.get("label") ?? "").trim();
  if (!label) return { status: "error", message: "El label es obligatorio." };

  const ratioInput = String(formData.get("ratio") ?? "");
  const ratio = RATIO_VALUES.includes(ratioInput) ? ratioInput : "4 / 5";

  const collectionId = String(formData.get("collection_id") ?? "") || null;
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const storagePath = `${crypto.randomUUID()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PHOTO_BUCKET)
    .upload(storagePath, file, { contentType: file.type, upsert: false });

  if (uploadError) {
    return { status: "error", message: `No se pudo subir el archivo: ${uploadError.message}` };
  }

  const { data: last } = await supabase
    .from("photos")
    .select("position")
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error: insertError } = await supabase.from("photos").insert({
    label,
    meta: String(formData.get("meta") ?? "").trim() || null,
    alt: String(formData.get("alt") ?? "").trim() || label,
    storage_path: storagePath,
    collection_id: collectionId,
    ratio,
    published: true,
    position: (last?.position ?? 0) + 1,
  });

  if (insertError) {
    // Don't leave an orphan object behind if the row never landed.
    await supabase.storage.from(PHOTO_BUCKET).remove([storagePath]);
    return { status: "error", message: `No se pudo guardar la ficha: ${insertError.message}` };
  }

  revalidatePath("/", "layout");

  return { status: "ok", message: `"${label}" se publicó en el archivo.` };
}
