"use client";

import { useState } from "react";
import { PhotoGrid } from "@/components/PhotoGrid";
import type { AdminPhoto } from "@/lib/types";

/**
 * `PhotoGrid` es el componente de producción, importado tal cual: la vista
 * previa no es una maqueta que se desactualice. Las columnas responden al ancho
 * de `.works-scope` gracias a las container queries de globals.css, así que
 * achicar esta caja reproduce de verdad lo que pasa en un teléfono.
 */
const WIDTHS = [
  { label: "375", value: 375, note: "Móvil" },
  { label: "768", value: 768, note: "Tablet" },
  { label: "1280", value: 1280, note: "Notebook" },
  { label: "1440", value: 1440, note: "Escritorio" },
] as const;

export function PreviewPane({ photos }: { photos: AdminPhoto[] }) {
  const [width, setWidth] = useState<number>(1440);
  const [showDrafts, setShowDrafts] = useState(false);

  const visible = showDrafts ? photos : photos.filter((p) => p.published);
  const hiddenCount = photos.length - photos.filter((p) => p.published).length;

  // El sitio público resta el padding lateral del Container antes de que la
  // grilla lo vea; se replica acá para que las columnas coincidan.
  const padding = width >= 768 ? 80 : 48;
  const contentWidth = Math.max(width - padding, 200);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-8 gap-y-4 border-b border-hairline pb-5">
        <div className="flex flex-wrap items-center gap-x-1 gap-y-2">
          {WIDTHS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => setWidth(w.value)}
              aria-pressed={width === w.value}
              className={`ui-tile-label cursor-pointer border px-4 py-2 transition-colors duration-300 ${
                width === w.value
                  ? "border-ink bg-ink text-paper"
                  : "border-hairline text-muted hover:border-ink hover:text-ink"
              }`}
            >
              {w.note} · {w.label}
            </button>
          ))}
        </div>

        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={showDrafts}
            onChange={(e) => setShowDrafts(e.target.checked)}
            className="size-3.5 accent-ink"
          />
          <span className="ui-tile-label text-muted">
            Incluir borradores{hiddenCount ? ` (${hiddenCount})` : ""}
          </span>
        </label>
      </div>

      {/* El padding va en la caja de afuera y el ancho exacto en la de adentro.
          Si el p-6 envolviera a la grilla, el contenedor de las container
          queries mediría 48px menos que en el sitio real y la vista previa
          mentiría justo en los bordes de cada breakpoint. */}
      <div className="mt-10 flex justify-center overflow-x-auto pb-6">
        <div className="shrink-0 border border-hairline bg-paper p-6">
          <div style={{ width: contentWidth }}>
            <PhotoGrid photos={visible} bare />
          </div>
        </div>
      </div>

      <p className="ui-tile-label mt-4 text-center text-tile-label">
        {visible.length} {visible.length === 1 ? "tarjeta" : "tarjetas"} · ancho de
        contenido {contentWidth}px
      </p>
    </div>
  );
}
