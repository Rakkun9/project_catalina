/**
 * Presets de proporción. Ya NO son el valor por defecto: son un recorte
 * opcional. Por defecto cada foto usa su proporción exacta, así `object-cover`
 * no tiene nada que recortar.
 */
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

export const DEFAULT_RATIO = "4 / 5";

/** Fuera de este rango la tarjeta rompe el ritmo de la grilla. */
const MIN_RATIO = 0.2; // 1:5
const MAX_RATIO = 5; //  5:1

/** "16 / 10" → 1.6. Devuelve `null` si la cadena no es una proporción válida. */
export function parseRatio(ratio: string): number | null {
  const parts = ratio.split("/");
  if (parts.length !== 2) return null;
  const [w, h] = parts.map((part) => Number(part.trim()));
  if (!Number.isFinite(w) || !Number.isFinite(h) || w <= 0 || h <= 0) return null;
  return w / h;
}

/** Acepta cualquier proporción razonable, no sólo los presets. */
export function isValidRatio(ratio: string): boolean {
  const value = parseRatio(ratio);
  return value !== null && value >= MIN_RATIO && value <= MAX_RATIO;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

/**
 * Proporción exacta de la imagen, reducida. 4032×3024 → "4 / 3".
 *
 * Si no se puede reducir a números chicos igual sirve: CSS acepta
 * `aspect-ratio: 4000 / 2667` sin problema, y es exacta.
 */
export function exactRatio(width: number, height: number): string {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) {
    return DEFAULT_RATIO;
  }

  const w = Math.round(width);
  const h = Math.round(height);
  const divisor = gcd(w, h) || 1;
  return `${w / divisor} / ${h / divisor}`;
}

/** "4 / 3" → "4:3". Para mostrar, no para CSS. */
export function formatRatio(ratio: string): string {
  return ratio.replace(/\s*\/\s*/, ":");
}

/**
 * Preset más cercano. Ya no se usa para elegir por defecto, sólo para
 * etiquetar de qué forma se acerca una proporción exacta.
 *
 * Compara en escala logarítmica para que el error se mida de forma
 * proporcional: en lineal, las proporciones anchas quedan más separadas entre
 * sí que las altas y una foto vertical tiende a caer siempre en el mismo preset.
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
