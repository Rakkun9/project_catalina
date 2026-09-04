import type { Collection, Photo } from "./types";

/**
 * Stand-in content, matching the canvas. Replaced as soon as Supabase is
 * configured and has rows — see `src/lib/queries.ts`.
 */

export const placeholderCollections: Collection[] = [
  { id: "c1", slug: "editorial", title: "Editorial", description: "Encargos para revistas y estudios de diseño.", position: 1 },
  { id: "c2", slug: "portrait", title: "Portrait", description: "Retratos a luz natural, sin dirección.", position: 2 },
  { id: "c3", slug: "architecture", title: "Architecture", description: "Volúmenes, sombra dura y repetición.", position: 3 },
  { id: "c4", slug: "still-life", title: "Still life", description: "Objetos cotidianos, mesa y ventana.", position: 4 },
];

type Seed = [ratio: string, slug: string, meta: string];

// Mismo orden y proporciones que los 18 artboards del canvas.
const seeds: Seed[] = [
  ["4 / 3", "editorial", "Editorial · 24"],
  ["3 / 4", "portrait", "Portrait · 12"],
  ["1 / 1", "still-life", "Still life · 09"],
  ["16 / 10", "architecture", "Arch · 31"],
  ["3 / 4", "editorial", "Editorial · 18"],
  ["1 / 1", "portrait", "Portrait · 06"],
  ["5 / 4", "architecture", "Arch · 42"],
  ["2 / 3", "editorial", "Editorial · 15"],
  ["4 / 3", "still-life", "Still life · 21"],
  ["3 / 4", "portrait", "Portrait · 08"],
  ["1 / 1", "editorial", "Editorial · 19"],
  ["4 / 5", "architecture", "Arch · 27"],
  ["2 / 3", "still-life", "Still life · 11"],
  ["16 / 10", "editorial", "Editorial · 33"],
  ["3 / 4", "portrait", "Portrait · 05"],
  ["1 / 1", "architecture", "Arch · 14"],
  ["5 / 7", "editorial", "Editorial · 22"],
  ["4 / 3", "still-life", "Still life · 07"],
];

export const placeholderPhotos: Photo[] = seeds.map(([ratio, slug, meta], i) => {
  const n = String(i + 1).padStart(2, "0");
  return {
    id: `p${n}`,
    label: `Proyecto ${n}`,
    meta,
    src: null,
    alt: `Proyecto ${n} — imagen de referencia`,
    collectionSlug: slug,
    ratio,
    position: i + 1,
  };
});
