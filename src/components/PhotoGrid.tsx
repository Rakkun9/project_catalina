import { PhotoTile } from "./PhotoTile";
import { Container } from "./Container";
import type { Photo } from "@/lib/types";

/**
 * `bare` deja la grilla sin el Container ni el padding vertical, para que la
 * vista previa del panel pueda meterla en una caja de ancho arbitrario. El
 * wrapper `.works-scope` es el contenedor de las container queries: sin él la
 * grilla se queda en una sola columna.
 */
export function PhotoGrid({ photos, bare = false }: { photos: Photo[]; bare?: boolean }) {
  if (!photos.length) {
    const empty = (
      <p className="ui-label text-muted">Todavía no hay proyectos en esta categoría.</p>
    );
    return bare ? empty : <Container className="py-24">{empty}</Container>;
  }

  const grid = (
    <div className="works-scope">
      <div className="works-grid">
        {photos.map((photo, i) => (
          <PhotoTile key={photo.id} photo={photo} priority={!bare && i < 4} />
        ))}
      </div>
    </div>
  );

  return bare ? grid : <Container className="pt-14 pb-6">{grid}</Container>;
}
