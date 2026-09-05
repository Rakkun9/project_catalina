"use client";

import { useState, useTransition } from "react";
import { slugify } from "@/lib/slug";
import type { Collection } from "@/lib/types";
import { deleteCollection, updateCollection } from "../actions";

const field =
  "w-full border-0 border-b border-hairline bg-transparent py-2 text-[0.8125rem] text-ink outline-none transition-colors duration-300 placeholder:text-tile-label focus:border-ink";

type Draft = { title: string; slug: string; description: string };

function draftOf(c: Collection): Draft {
  return { title: c.title, slug: c.slug, description: c.description ?? "" };
}

export function CategoryRow({
  collection,
  photoCount,
  index,
  total,
  onMove,
  onSaved,
  onRemoved,
  onStatus,
  disabled,
}: {
  collection: Collection;
  photoCount: number;
  index: number;
  total: number;
  onMove: (from: number, to: number) => void;
  onSaved: (patch: Partial<Collection>) => void;
  onRemoved: () => void;
  onStatus: (ok: boolean, message: string) => void;
  disabled: boolean;
}) {
  const [draft, setDraft] = useState<Draft>(() => draftOf(collection));
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();

  const original = draftOf(collection);
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== original[k]);

  // La URL se normaliza al guardar; mostrarla ya normalizada evita la sorpresa.
  const previewSlug = slugify(draft.slug || draft.title);

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function save() {
    startTransition(async () => {
      const result = await updateCollection(collection.id, {
        title: draft.title,
        slug: draft.slug || draft.title,
        description: draft.description,
      });
      onStatus(result.ok, result.message);
      if (result.ok) {
        onSaved({
          title: draft.title.trim(),
          slug: previewSlug,
          description: draft.description.trim() || null,
        });
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const result = await deleteCollection(collection.id);
      onStatus(result.ok, result.message);
      if (result.ok) onRemoved();
      else setConfirming(false);
    });
  }

  return (
    <li className="border-b border-hairline py-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-start md:gap-7">
        <div className="flex shrink-0 gap-2 md:w-20">
          <button
            type="button"
            onClick={() => onMove(index, index - 1)}
            disabled={disabled || pending || index === 0}
            aria-label={`Mover ${collection.title} antes`}
            className="ui-tile-label flex-1 cursor-pointer border border-hairline py-1.5 text-muted transition-colors duration-300 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:text-tile-label disabled:hover:border-hairline"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => onMove(index, index + 1)}
            disabled={disabled || pending || index === total - 1}
            aria-label={`Mover ${collection.title} después`}
            className="ui-tile-label flex-1 cursor-pointer border border-hairline py-1.5 text-muted transition-colors duration-300 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:text-tile-label disabled:hover:border-hairline"
          >
            ↓
          </button>
        </div>

        <div className="min-w-0 flex-1">
          <div className="grid grid-cols-1 gap-x-7 gap-y-4 sm:grid-cols-2">
            <label className="block">
              <span className="ui-tile-label text-muted">Nombre</span>
              <input
                value={draft.title}
                onChange={(e) => set("title", e.target.value)}
                className={field}
              />
            </label>

            <label className="block">
              <span className="ui-tile-label text-muted">URL</span>
              <input
                value={draft.slug}
                onChange={(e) => set("slug", e.target.value)}
                placeholder={slugify(draft.title)}
                className={field}
              />
              <span className="ui-tile-label mt-1.5 block font-mono text-tile-label">
                /collections/{previewSlug || "…"}
              </span>
            </label>

            <label className="block sm:col-span-2">
              <span className="ui-tile-label text-muted">Descripción</span>
              <input
                value={draft.description}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Se muestra bajo el título en la vista filtrada"
                className={field}
              />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
            <button
              type="button"
              onClick={save}
              disabled={!dirty || pending || disabled}
              className="ui-tile-label cursor-pointer border border-ink px-4 py-2 text-ink transition-colors duration-300 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-hairline disabled:text-tile-label disabled:hover:bg-transparent"
            >
              {pending ? "Guardando…" : dirty ? "Guardar" : "Guardado"}
            </button>

            {dirty ? (
              <button
                type="button"
                onClick={() => setDraft(draftOf(collection))}
                disabled={pending}
                className="ui-tile-label cursor-pointer text-muted transition-colors duration-300 hover:text-ink"
              >
                Descartar
              </button>
            ) : null}

            <span className="ui-tile-label ml-auto text-tile-label">
              {photoCount} {photoCount === 1 ? "foto" : "fotos"}
            </span>

            {confirming ? (
              <span className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="ui-tile-label text-muted">
                  {photoCount
                    ? `${photoCount} ${photoCount === 1 ? "foto quedará" : "fotos quedarán"} sin categoría`
                    : "No hay fotos asociadas"}
                </span>
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
                disabled={disabled}
                className="ui-tile-label cursor-pointer text-muted transition-colors duration-300 hover:text-accent disabled:cursor-not-allowed"
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
