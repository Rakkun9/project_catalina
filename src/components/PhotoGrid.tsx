import { PhotoTile } from "./PhotoTile";
import { Container } from "./Container";
import type { Photo } from "@/lib/types";

export function PhotoGrid({ photos }: { photos: Photo[] }) {
  if (!photos.length) {
    return (
      <Container className="py-24">
        <p className="ui-label text-muted">Todavía no hay proyectos en esta categoría.</p>
      </Container>
    );
  }

  return (
    <Container className="pt-14 pb-6">
      <div className="works-grid">
        {photos.map((photo, i) => (
          <PhotoTile key={photo.id} photo={photo} priority={i < 4} />
        ))}
      </div>
    </Container>
  );
}
