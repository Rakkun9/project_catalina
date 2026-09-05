"use client";

import { RATIOS, exactRatio, formatRatio, parseRatio } from "@/lib/ratios";

/**
 * Selector de proporción. La primera opción es siempre la proporción exacta de
 * la foto — la que NO recorta nada. Los presets siguen disponibles como recorte
 * deliberado, pero ya no son el default.
 */
export function RatioSelect({
  value,
  width,
  height,
  onChange,
  disabled = false,
  className = "",
  id,
}: {
  value: string;
  width: number | null;
  height: number | null;
  onChange: (ratio: string) => void;
  disabled?: boolean;
  className?: string;
  id?: string;
}) {
  const original = width && height ? exactRatio(width, height) : null;
  const isPreset = RATIOS.some((r) => r.value === value);

  // Si la proporción guardada no es ni la original ni un preset (por ejemplo
  // viene de una carga vieja), se agrega para no perderla al abrir el select.
  const orphan = !isPreset && value !== original ? value : null;

  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      className={`cursor-pointer ${className}`}
    >
      {original ? (
        <option value={original}>Original — {formatRatio(original)} (sin recorte)</option>
      ) : null}

      {orphan ? <option value={orphan}>Actual — {formatRatio(orphan)}</option> : null}

      <optgroup label="Recortar a un preset">
        {RATIOS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.name} — {formatRatio(r.value)}
          </option>
        ))}
      </optgroup>
    </select>
  );
}

/** Cuánto se recorta con la proporción elegida, para avisarlo en la interfaz. */
export function cropAmount(
  ratio: string,
  width: number | null,
  height: number | null,
): number {
  if (!width || !height) return 0;
  const frame = parseRatio(ratio);
  const source = width / height;
  if (frame === null || source <= 0) return 0;

  // object-cover escala hasta cubrir: se pierde el excedente del lado largo.
  const visible = frame > source ? source / frame : frame / source;
  return Math.max(0, 1 - visible);
}
