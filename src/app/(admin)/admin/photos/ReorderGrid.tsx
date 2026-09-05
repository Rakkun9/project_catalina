"use client";

import Image from "next/image";
import { useState } from "react";
import type { AdminPhoto } from "@/lib/types";

/**
 * Reordenamiento con la API nativa de arrastre de HTML5 — cero dependencias.
 * Los botones ↑ ↓ no son un adorno: el drag-and-drop nativo no existe en touch
 * y no es accesible por teclado, así que son el camino principal en móvil.
 */
export function ReorderGrid({
  photos,
  onMove,
  disabled,
}: {
  photos: AdminPhoto[];
  onMove: (from: number, to: number) => void;
  disabled: boolean;
}) {
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  return (
    <ol className="grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {photos.map((photo, index) => {
        const isDragging = dragging === index;
        const isOver = over === index && dragging !== null && dragging !== index;

        return (
          <li
            key={photo.id}
            draggable={!disabled}
            onDragStart={() => setDragging(index)}
            onDragEnd={() => {
              setDragging(null);
              setOver(null);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOver(index);
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragging !== null && dragging !== index) onMove(dragging, index);
              setDragging(null);
              setOver(null);
            }}
            className={`transition-opacity duration-200 ${isDragging ? "opacity-40" : ""}`}
          >
            <div
              style={{ aspectRatio: photo.ratio }}
              className={`relative overflow-hidden rounded-tile bg-tile ${
                isOver ? "outline-2 outline-offset-2 outline-ink" : ""
              } ${disabled ? "" : "cursor-grab active:cursor-grabbing"}`}
            >
              {photo.src ? (
                <Image
                  src={photo.src}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 50vw, 20vw"
                  className="pointer-events-none object-cover"
                />
              ) : (
                <div className="tile-fill h-full w-full" />
              )}

              {!photo.published ? (
                <span className="ui-tile-label absolute top-2 left-2 bg-paper px-2 py-1 text-muted">
                  Borrador
                </span>
              ) : null}
            </div>

            <div className="mt-2.5 flex items-baseline justify-between gap-2 border-t border-hairline pt-2">
              <span className="ui-tile-label truncate text-ink">{photo.label}</span>
              <span className="ui-tile-label font-mono text-tile-label">
                {String(index + 1).padStart(2, "0")}
              </span>
            </div>

            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => onMove(index, index - 1)}
                disabled={disabled || index === 0}
                aria-label={`Mover ${photo.label} antes`}
                className="ui-tile-label flex-1 cursor-pointer border border-hairline py-1.5 text-muted transition-colors duration-300 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:text-tile-label disabled:hover:border-hairline"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => onMove(index, index + 1)}
                disabled={disabled || index === photos.length - 1}
                aria-label={`Mover ${photo.label} después`}
                className="ui-tile-label flex-1 cursor-pointer border border-hairline py-1.5 text-muted transition-colors duration-300 hover:border-ink hover:text-ink disabled:cursor-not-allowed disabled:text-tile-label disabled:hover:border-hairline"
              >
                ↓
              </button>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
