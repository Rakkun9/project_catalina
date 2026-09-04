/** Proporciones que usa la grilla — mantienen el ritmo del canvas. */
export const RATIOS = [
  { value: "16 / 10", name: "Panorámica" },
  { value: "5 / 4", name: "Horizontal ancha" },
  { value: "4 / 3", name: "Horizontal" },
  { value: "1 / 1", name: "Cuadrada" },
  { value: "4 / 5", name: "Vertical suave" },
  { value: "3 / 4", name: "Vertical" },
  { value: "2 / 3", name: "Vertical alta" },
  { value: "5 / 7", name: "Vertical muy alta" },
] as const;

export const RATIO_VALUES: readonly string[] = RATIOS.map((r) => r.value);

export const DEFAULT_RATIO = "4 / 5";

/** "16 / 10" → 1.6. Devuelve `null` si la cadena no es una proporción válida. */
export function parseRatio(ratio: string): number | null {
  const [w, h] = ratio.split("/").map((part) => Number(part.trim()));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return w / h;
}

/**
 * Preset más cercano a las dimensiones reales del archivo.
 *
 * Compara en escala logarítmica para que el error se mida de forma proporcional:
 * en lineal, las proporciones anchas quedan más separadas entre sí que las altas
 * y una foto vertical tiende a caer siempre en el mismo preset.
 */
export function closestRatio(width: number, height: number): string {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return DEFAULT_RATIO;
  }

  const target = Math.log(width / height);
  let best = DEFAULT_RATIO;
  let bestDistance = Infinity;

  for (const { value } of RATIOS) {
    const parsed = parseRatio(value);
    if (parsed === null) continue;
    const distance = Math.abs(Math.log(parsed) - target);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = value;
    }
  }

  return best;
}
