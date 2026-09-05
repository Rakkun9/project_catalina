"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { slugify } from "@/lib/slug";
import type { Collection } from "@/lib/types";
import { createCollection, reorderCollections } from "../actions";
import { CategoryRow } from "./CategoryRow";

const field =
  "w-full border-0 border-b border-hairline bg-transparent py-2 text-[0.8125rem] text-ink outline-none transition-colors duration-300 placeholder:text-tile-label focus:border-ink";

export function CategoryManager({
  initialCollections,
  counts,
}: {
  initialCollections: Collection[];
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [collections, setCollections] = useState(initialCollections);
  const [savedOrder, setSavedOrder] = useState(() =>
    initialCollections.map((c) => c.id).join(),
  );
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [pending, startTransition] = useTransition();

  const orderDirty = collections.map((c) => c.id).join() !== savedOrder;

  function onStatus(ok: boolean, message: string) {
    setStatus({ ok, message });
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= collections.length || from === to) return;
    setCollections((list) => {
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function saveOrder() {
    const ids = collections.map((c) => c.id);
    startTransition(async () => {
      const result = await reorderCollections(ids);
      onStatus(result.ok, result.message);
      if (result.ok) setSavedOrder(ids.join());
    });
  }

  function create() {
    startTransition(async () => {
      const result = await createCollection(newTitle, newDescription);
      onStatus(result.ok, result.message);
      if (result.ok) {
        setNewTitle("");
        setNewDescription("");
        // La fila nueva viene del servidor con su id real.
        router.refresh();
      }
    });
  }

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 py-12 md:px-10 md:py-16">
      <div>
        <p className="ui-eyebrow text-muted">Panel / Categorías</p>
        <h1 className="display mt-6 text-[clamp(1.75rem,4vw,2.5rem)]">
          {collections.length} {collections.length === 1 ? "categoría" : "categorías"}
        </h1>
        <p className="mt-6 max-w-[56ch] text-[0.9375rem] leading-[1.7] text-muted">
          El orden define cómo aparecen en la barra de filtros del sitio. Borrar una
          categoría no borra sus fotos: quedan sin categoría y se pueden reasignar
          desde la lista.
        </p>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-end gap-x-6 gap-y-3 border-b border-hairline pb-5">
        {orderDirty ? (
          <>
            <span className="ui-tile-label text-accent">Orden sin guardar</span>
            <button
              type="button"
              onClick={() => {
                setCollections(initialCollections);
                setSavedOrder(initialCollections.map((c) => c.id).join());
              }}
              disabled={pending}
              className="ui-tile-label cursor-pointer text-muted transition-colors duration-300 hover:text-ink"
            >
              Descartar
            </button>
            <button
              type="button"
              onClick={saveOrder}
              disabled={pending}
              className="ui-label cursor-pointer border border-ink px-5 py-2.5 text-ink transition-colors duration-300 hover:bg-ink hover:text-paper disabled:cursor-not-allowed"
            >
              {pending ? "Guardando…" : "Guardar orden"}
            </button>
          </>
        ) : (
          <span className="ui-tile-label text-tile-label">Orden guardado</span>
        )}
      </div>

      {status ? (
        <p role="status" className={`mt-6 text-sm ${status.ok ? "text-muted" : "text-accent"}`}>
          {status.message}
        </p>
      ) : null}

      <ul className="mt-10 border-t border-hairline">
        {collections.map((collection, index) => (
          <CategoryRow
            key={collection.id}
            collection={collection}
            photoCount={counts[collection.id] ?? 0}
            index={index}
            total={collections.length}
            onMove={move}
            onSaved={(patch) =>
              setCollections((list) =>
                list.map((c) => (c.id === collection.id ? { ...c, ...patch } : c)),
              )
            }
            onRemoved={() => {
              setCollections((list) => list.filter((c) => c.id !== collection.id));
              router.refresh();
            }}
            onStatus={onStatus}
            disabled={pending}
          />
        ))}
      </ul>

      <div className="mt-14 max-w-2xl border border-hairline p-8">
        <p className="ui-label text-ink">Nueva categoría</p>

        <div className="mt-8 grid grid-cols-1 gap-x-7 gap-y-5 sm:grid-cols-2">
          <label className="block">
            <span className="ui-tile-label text-muted">Nombre</span>
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Paisaje"
              disabled={pending}
              className={field}
            />
            <span className="ui-tile-label mt-1.5 block font-mono text-tile-label">
              /collections/{slugify(newTitle) || "…"}
            </span>
          </label>

          <label className="block">
            <span className="ui-tile-label text-muted">Descripción</span>
            <input
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Opcional"
              disabled={pending}
              className={field}
            />
          </label>
        </div>

        <button
          type="button"
          onClick={create}
          disabled={pending || !slugify(newTitle)}
          className="ui-label mt-9 cursor-pointer border border-ink px-7 py-3.5 text-ink transition-colors duration-300 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-hairline disabled:text-muted disabled:hover:bg-transparent"
        >
          {pending ? "Creando…" : "Crear categoría"}
        </button>
      </div>
    </div>
  );
}
