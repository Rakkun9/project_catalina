"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { RATIOS } from "@/lib/ratios";
import type { AdminPhoto, Collection } from "@/lib/types";
import { deletePhoto, updatePhoto, type PhotoPatch } from "../actions";

const field =
  "w-full border-0 border-b border-hairline bg-transparent py-2 text-[0.8125rem] text-ink outline-none transition-colors duration-300 placeholder:text-tile-label focus:border-ink";

type Draft = { label: string; meta: string; alt: string; ratio: string; collectionId: string };

function draftOf(photo: AdminPhoto): Draft {
  return {
    label: photo.label,
    meta: photo.meta ?? "",
    alt: photo.alt ?? "",
    ratio: photo.ratio,
    collectionId: photo.collectionId ?? "",
  };
}

export function PhotoRow({
  photo,
  collections,
  onSaved,
  onRemoved,
  onStatus,
}: {
  photo: AdminPhoto;
  collections: Collection[];
  onSaved: (patch: Partial<AdminPhoto>) => void;
  onRemoved: () => void;
  onStatus: (ok: boolean, message: string) => void;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(photo));
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const original = draftOf(photo);
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== original[k]);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function save() {
    const patch: PhotoPatch = {
      label: draft.label,
      meta: draft.meta,
      alt: draft.alt,
      ratio: draft.ratio,
      collectionId: draft.collectionId || null,
    };

    startTransition(async () => {
      const result = await updatePhoto(photo.id, patch);
      onStatus(result.ok, result.message);
      if (!result.ok) return;

      const collection = collections.find((c) => c.id === draft.collectionId);
      onSaved({
        label: draft.label.trim(),
        meta: draft.meta.trim() || null,
        alt: draft.alt.trim() || draft.label.trim(),
        ratio: draft.ratio,
        collectionId: draft.collectionId || null,
        collectionSlug: collection?.slug ?? null,
      });
    });
  }

  // Publicar / despublicar guarda al instante: es la acción más frecuente y no
  // tiene sentido que quede pendiente junto con el resto de los campos.
  function togglePublished() {
    const next = !photo.published;
    startTransition(async () => {
      const result = await updatePhoto(photo.id, { published: next });
      onStatus(result.ok, result.message);
      if (result.ok) onSaved({ published: next });
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deletePhoto(photo.id);
      onStatus(result.ok, result.message);
      if (result.ok) onRemoved();
      else setConfirming(false);
    });
  }

  return (
    <li className="border-b border-hairline py-6">
      <div className="flex flex-col gap-5 md:flex-row md:gap-7">
        <div
          style={{ aspectRatio: photo.ratio }}
          className="relative w-24 shrink-0 overflow-hidden bg-tile md:w-28"
        >
          {photo.src ? (
            <Image src={photo.src} alt="" fill sizes="112px" className="object-cover" />
          ) : (
            <div className="tile-fill h-full w-full" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
            <label className="block">
              <span className="ui-tile-label text-muted">Label</span>
              <input
                value={draft.label}
                onChange={(e) => set("label", e.target.value)}
                className={field}
              />
            </label>

            <label className="block">
              <span className="ui-tile-label text-muted">Dato corto</span>
              <input
                value={draft.meta}
                onChange={(e) => set("meta", e.target.value)}
                placeholder="Editorial · 24"
                className={field}
              />
            </label>

            <label className="block sm:col-span-2">
              <span className="ui-tile-label text-muted">Texto alternativo</span>
              <input
                value={draft.alt}
                onChange={(e) => set("alt", e.target.value)}
                placeholder="Descripción para lectores de pantalla"
                className={field}
              />
            </label>

            <label className="block">
              <span className="ui-tile-label text-muted">Proporción</span>
              <select
                value={draft.ratio}
                onChange={(e) => set("ratio", e.target.value)}
                className={`${field} cursor-pointer`}
              >
                {RATIOS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.name} — {r.value}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="ui-tile-label text-muted">Categoría</span>
              <select
                value={draft.collectionId}
                onChange={(e) => set("collectionId", e.target.value)}
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
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={togglePublished}
              disabled={pending}
              className={`ui-tile-label cursor-pointer border px-4 py-2 transition-colors duration-300 disabled:cursor-not-allowed ${
                photo.published
                  ? "border-ink text-ink hover:bg-ink hover:text-paper"
                  : "border-hairline text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {photo.published ? "Publicada" : "Borrador"}
            </button>

            <button
              type="button"
              onClick={save}
              disabled={!dirty || pending}
              className="ui-tile-label cursor-pointer border border-ink px-4 py-2 text-ink transition-colors duration-300 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-hairline disabled:text-tile-label disabled:hover:bg-transparent"
            >
              {pending ? "Guardando…" : dirty ? "Guardar" : "Guardado"}
            </button>

            {dirty ? (
              <button
                type="button"
                onClick={() => setDraft(draftOf(photo))}
                disabled={pending}
                className="ui-tile-label cursor-pointer text-muted transition-colors duration-300 hover:text-ink"
              >
                Descartar
              </button>
            ) : null}

            <span className="ui-tile-label ml-auto font-mono text-tile-label">
              {photo.width && photo.height ? `${photo.width}×${photo.height}` : "—"}
            </span>

            {confirming ? (
              <span className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={remove}
                  disabled={pending}
                  className="ui-tile-label cursor-pointer border border-accent px-4 py-2 text-accent transition-colors duration-300 hover:bg-accent hover:text-paper disabled:cursor-not-allowed"
                >
                  {pending ? "Borrando…" : "Confirmar borrado"}
                </button>
                <button
                  type="button"
                  onClick={() => setConfirming(false)}
                  className="ui-tile-label cursor-pointer text-muted transition-colors duration-300 hover:text-ink"
                >
                  Cancelar
                </button>
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setConfirming(true)}
                className="ui-tile-label cursor-pointer text-muted transition-colors duration-300 hover:text-accent"
              >
                Borrar
              </button>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}
