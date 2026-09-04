"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { labelFromFilename, processImage } from "@/lib/image";
import { RATIOS } from "@/lib/ratios";
import { PHOTO_BUCKET } from "@/lib/supabase/config";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import type { Collection } from "@/lib/types";

const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_BYTES = 40 * 1024 * 1024;

type Stage = "ready" | "processing" | "uploading" | "done" | "error";

type Item = {
  key: string;
  file: File;
  label: string;
  ratio: string;
  stage: Stage;
  message?: string;
  previewUrl: string;
  /** Tamaño del archivo generado, para mostrar cuánto se ahorró. */
  outputBytes?: number;
};

const field =
  "w-full border-0 border-b border-hairline bg-transparent py-2 text-[0.8125rem] text-ink outline-none transition-colors duration-300 focus:border-ink";

const STAGE_LABEL: Record<Stage, string> = {
  ready: "En cola",
  processing: "Procesando",
  uploading: "Subiendo",
  done: "Listo",
  error: "Error",
};

export function UploadClient({ collections }: { collections: Collection[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const [items, setItems] = useState<Item[]>([]);
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [publish, setPublish] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const patch = useCallback((key: string, next: Partial<Item>) => {
    setItems((list) => list.map((i) => (i.key === key ? { ...i, ...next } : i)));
  }, []);

  const addFiles = useCallback((files: FileList | File[]) => {
    setError(null);
    const rejected: string[] = [];

    const accepted = Array.from(files).filter((file) => {
      if (!ACCEPTED.includes(file.type)) {
        rejected.push(`${file.name} (formato no admitido)`);
        return false;
      }
      if (file.size > MAX_BYTES) {
        rejected.push(`${file.name} (supera los 40 MB)`);
        return false;
      }
      return true;
    });

    if (rejected.length) setError(`Se ignoraron: ${rejected.join(", ")}`);

    setItems((list) => [
      ...list,
      ...accepted.map((file, i) => ({
        key: `${Date.now()}-${i}-${file.name}`,
        file,
        label: labelFromFilename(file.name),
        // Se corrige apenas se lee el archivo, en el paso de procesado.
        ratio: "4 / 5",
        stage: "ready" as Stage,
        previewUrl: URL.createObjectURL(file),
      })),
    ]);
  }, []);

  function removeItem(key: string) {
    setItems((list) => {
      const target = list.find((i) => i.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return list.filter((i) => i.key !== key);
    });
  }

  async function uploadAll() {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase no está configurado.");
      return;
    }

    setRunning(true);
    setError(null);

    // Una sola lectura del máximo actual; después se incrementa en memoria para
    // no consultar la base por cada archivo.
    const { data: last } = await supabase
      .from("photos")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle();

    let position = ((last as { position: number } | null)?.position ?? 0) + 1;
    const collection = collections.find((c) => c.id === collectionId);
    let uploaded = 0;

    // Secuencial a propósito: procesar varias imágenes grandes en paralelo
    // satura la memoria del navegador y hace el conjunto más lento, no más rápido.
    for (const item of items) {
      if (item.stage === "done") continue;

      try {
        patch(item.key, { stage: "processing", message: undefined });
        const processed = await processImage(item.file);
        patch(item.key, {
          stage: "uploading",
          ratio: processed.ratio,
          outputBytes: processed.blob.size,
        });

        const path = `${crypto.randomUUID()}.${processed.extension}`;
        const { error: storageError } = await supabase.storage
          .from(PHOTO_BUCKET)
          .upload(path, processed.blob, {
            contentType: processed.blob.type,
            upsert: false,
          });

        if (storageError) throw new Error(storageError.message);

        const label = item.label.trim() || labelFromFilename(item.file.name);
        const meta = collection
          ? `${collection.title} · ${String(position).padStart(2, "0")}`
          : null;

        const { error: insertError } = await supabase.from("photos").insert({
          label,
          meta,
          alt: label,
          storage_path: path,
          collection_id: collectionId || null,
          ratio: processed.ratio,
          width: processed.width,
          height: processed.height,
          published: publish,
          position,
        });

        if (insertError) {
          // No dejar el archivo huérfano si la ficha no llegó a guardarse.
          await supabase.storage.from(PHOTO_BUCKET).remove([path]);
          throw new Error(insertError.message);
        }

        position += 1;
        uploaded += 1;
        patch(item.key, { stage: "done", message: undefined });
      } catch (cause) {
        patch(item.key, {
          stage: "error",
          message: cause instanceof Error ? cause.message : "Error desconocido.",
        });
      }
    }

    setRunning(false);
    if (uploaded > 0) router.refresh();
  }

  const pendingCount = items.filter((i) => i.stage !== "done").length;

  return (
    <div>
      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (!running) addFiles(e.dataTransfer.files);
        }}
        className="flex flex-col items-center justify-center border border-dashed border-hairline px-6 py-20 text-center"
      >
        <p className="text-[0.9375rem] text-muted">
          Arrastrá las fotos acá, o elegilas desde el disco.
        </p>
        <p className="ui-tile-label mt-3 text-tile-label">
          JPG, PNG, WebP o AVIF · máx. 40 MB por archivo
        </p>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={running}
          className="ui-label mt-9 cursor-pointer border border-ink px-7 py-3.5 text-ink transition-colors duration-300 hover:bg-ink hover:text-paper disabled:cursor-not-allowed"
        >
          Elegir archivos
        </button>

        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPTED.join(",")}
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
        />
      </div>

      {error ? (
        <p role="alert" className="mt-6 text-sm text-accent">
          {error}
        </p>
      ) : null}

      {items.length > 0 ? (
        <>
          <div className="mt-14 flex flex-wrap items-end gap-x-10 gap-y-6 border-b border-hairline pb-6">
            <label className="block w-56">
              <span className="ui-tile-label text-muted">Categoría</span>
              <select
                value={collectionId}
                onChange={(e) => setCollectionId(e.target.value)}
                disabled={running}
                className={`${field} cursor-pointer`}
              >
                <option value="">Sin categoría</option>
                {collections.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex cursor-pointer items-center gap-3 pb-2">
              <input
                type="checkbox"
                checked={publish}
                onChange={(e) => setPublish(e.target.checked)}
                disabled={running}
                className="size-3.5 accent-ink"
              />
              <span className="ui-tile-label text-muted">Publicar al subir</span>
            </label>

            <button
              type="button"
              onClick={uploadAll}
              disabled={running || pendingCount === 0}
              className="ui-label ml-auto cursor-pointer border border-ink px-7 py-3.5 text-ink transition-colors duration-300 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-hairline disabled:text-muted disabled:hover:bg-transparent"
            >
              {running
                ? "Subiendo…"
                : pendingCount === 0
                  ? "Todo subido"
                  : `Subir ${pendingCount} ${pendingCount === 1 ? "foto" : "fotos"}`}
            </button>
          </div>

          <ul className="border-t border-hairline">
            {items.map((item) => (
              <li
                key={item.key}
                className="flex flex-col gap-5 border-b border-hairline py-6 md:flex-row md:items-start md:gap-7"
              >
                <div className="relative h-20 w-20 shrink-0 overflow-hidden bg-tile">
                  {/* Blob local: next/image no aporta nada y no puede optimizarlo. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.previewUrl}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>

                <div className="grid min-w-0 flex-1 grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="ui-tile-label text-muted">Label</span>
                    <input
                      value={item.label}
                      onChange={(e) => patch(item.key, { label: e.target.value })}
                      disabled={running || item.stage === "done"}
                      className={field}
                    />
                  </label>

                  <label className="block">
                    <span className="ui-tile-label text-muted">
                      Proporción {item.stage === "ready" ? "(se detecta al subir)" : ""}
                    </span>
                    <select
                      value={item.ratio}
                      onChange={(e) => patch(item.key, { ratio: e.target.value })}
                      disabled={running || item.stage === "done"}
                      className={`${field} cursor-pointer`}
                    >
                      {RATIOS.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.name} — {r.value}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="flex shrink-0 flex-col items-start gap-2 md:w-44 md:items-end">
                  <span
                    className={`ui-tile-label ${
                      item.stage === "error"
                        ? "text-accent"
                        : item.stage === "done"
                          ? "text-ink"
                          : "text-muted"
                    }`}
                  >
                    {STAGE_LABEL[item.stage]}
                  </span>

                  <span className="ui-tile-label font-mono text-tile-label">
                    {formatBytes(item.file.size)}
                    {item.outputBytes ? ` → ${formatBytes(item.outputBytes)}` : ""}
                  </span>

                  {item.message ? (
                    <span className="text-right text-xs leading-relaxed text-accent">
                      {item.message}
                    </span>
                  ) : null}

                  {!running && item.stage !== "done" ? (
                    <button
                      type="button"
                      onClick={() => removeItem(item.key)}
                      className="ui-tile-label cursor-pointer text-muted transition-colors duration-300 hover:text-accent"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
