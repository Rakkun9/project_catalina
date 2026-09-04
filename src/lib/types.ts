/** Shape shared by the placeholder dataset and the Supabase tables. */

export type Collection = {
  id: string;
  slug: string;
  title: string;
  /** Short line under the title on a filtered view. */
  description: string | null;
  position: number;
};

export type Photo = {
  id: string;
  /** Uppercase label at the left of the tile footer, e.g. "PROYECTO 01". */
  label: string;
  /** Right side of the tile footer, e.g. "EDITORIAL · 24". */
  meta: string | null;
  /** Public URL of the image. `null` renders the tonal placeholder instead. */
  src: string | null;
  alt: string;
  collectionSlug: string | null;
  /** CSS aspect-ratio for the frame, e.g. "4 / 3". Drives the masonry rhythm. */
  ratio: string;
  position: number;
};
