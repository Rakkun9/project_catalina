"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import type { AdminPhoto, Collection } from "@/lib/types";
import { reorderPhotos, resetRatiosToOriginal } from "../actions";
import { PhotoRow } from "./PhotoRow";
import { PreviewPane } from "./PreviewPane";
import { ReorderGrid } from "./ReorderGrid";

type Mode = "list" | "grid" | "preview";

const MODES: { id: Mode; label: string }[] = [
  { id: "list", label: "Lista" },
  { id: "grid", label: "Orden" },
  { id: "preview", label: "Vista previa" },
];

export function PhotoManager({
  initialPhotos,
  collections,
}: {
  initialPhotos: AdminPhoto[];
  collections: Collection[];
}) {
  // Una sola fuente de verdad para los tres modos: reordenar en "Orden" se ve
  // inmediatamente en "Vista previa", sin necesidad de guardar antes.
  const router = useRouter();
  const [photos, setPhotos] = useState(initialPhotos);
  const [savedOrder, setSavedOrder] = useState(() => initialPhotos.map((p) => p.id).join());
  const [mode, setMode] = useState<Mode>("list");
  const [status, setStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const [pending, startTransition] = useTransition();

  const orderDirty = photos.map((p) => p.id).join() !== savedOrder;

  function onStatus(ok: boolean, message: string) {
    setStatus({ ok, message });
  }

  function patchPhoto(id: string, patch: Partial<AdminPhoto>) {
    setPhotos((list) => list.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }

  function move(from: number, to: number) {
    if (to < 0 || to >= photos.length || from === to) return;
    setPhotos((list) => {
      const next = [...list];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  }

  function resetRatios() {
    startTransition(async () => {
      const result = await resetRatiosToOriginal();
      onStatus(result.ok, result.message);
      if (result.ok) router.refresh();
    });
  }

  function saveOrder() {
    const ids = photos.map((p) => p.id);
    startTransition(async () => {
      const result = await reorderPhotos(ids);
      onStatus(result.ok, result.message);
      if (result.ok) setSavedOrder(ids.join());
    });
  }

  const published = photos.filter((p) => p.published).length;

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 py-12 md:px-10 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <p className="ui-eyebrow text-muted">Panel / Fotos</p>
          <h1 className="display mt-6 text-[clamp(1.75rem,4vw,2.5rem)]">
            {photos.length} {photos.length === 1 ? "foto" : "fotos"} en el archivo
          </h1>
          <p className="ui-label mt-4 text-muted">
            {published} publicadas · {photos.length - published} en borrador
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-3">
          {photos.length > 0 ? (
            <button
              type="button"
              onClick={resetRatios}
              disabled={pending}
              title="Quita el recorte de todas las fotos y usa su proporción real"
              className="ui-label cursor-pointer border border-hairline px-6 py-3.5 text-muted transition-colors duration-300 hover:border-ink hover:text-ink disabled:cursor-not-allowed"
            >
              Quitar recortes
            </button>
          ) : null}

          <Link
            href="/admin/photos/upload"
            className="ui-label border border-ink px-7 py-3.5 text-ink transition-colors duration-300 hover:bg-ink hover:text-paper"
          >
            Subir fotos
          </Link>
        </div>
      </div>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-hairline pb-5">
        <div className="flex gap-x-1">
          {MODES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMode(m.id)}
              aria-pressed={mode === m.id}
              className={`ui-label cursor-pointer border px-5 py-2.5 transition-colors duration-300 ${
                mode === m.id
                  ? "border-ink bg-ink text-paper"
                  : "border-hairline text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        {orderDirty ? (
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            <span className="ui-tile-label text-accent">Orden sin guardar</span>
            <button
              type="button"
              onClick={() => {
                setPhotos(initialPhotos);
                setSavedOrder(initialPhotos.map((p) => p.id).join());
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
          </div>
        ) : null}
      </div>

      {status ? (
        <p
          role="status"
          className={`mt-6 text-sm ${status.ok ? "text-muted" : "text-accent"}`}
        >
          {status.message}
        </p>
      ) : null}

      <div className="mt-10">
        {photos.length === 0 ? (
          <EmptyState />
        ) : mode === "list" ? (
          <ul className="border-t border-hairline">
            {photos.map((photo) => (
              <PhotoRow
                key={photo.id}
                photo={photo}
                collections={collections}
                onSaved={(patch) => patchPhoto(photo.id, patch)}
                onRemoved={() => setPhotos((l) => l.filter((p) => p.id !== photo.id))}
                onStatus={onStatus}
              />
            ))}
          </ul>
        ) : mode === "grid" ? (
          <ReorderGrid photos={photos} onMove={move} disabled={pending} />
        ) : (
          <PreviewPane photos={photos} />
        )}
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="border-t border-hairline py-24 text-center">
      <p className="text-[0.9375rem] text-muted">
        Todavía no hay fotos cargadas — o Supabase no está configurado.
      </p>
      <Link
        href="/admin/photos/upload"
        className="ui-label mt-8 inline-block border-b border-hairline pb-1.5 text-muted transition-colors duration-300 hover:border-ink hover:text-ink"
      >
        Subir la primera
      </Link>
    </div>
  );
}
