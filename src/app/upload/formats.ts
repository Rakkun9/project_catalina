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

export const RATIO_VALUES = RATIOS.map((r) => r.value) as readonly string[];
