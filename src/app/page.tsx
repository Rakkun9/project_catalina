import { FilterBar } from "@/components/FilterBar";
import { LoadMore } from "@/components/LoadMore";
import { PageIntro } from "@/components/PageIntro";
import { PhotoGrid } from "@/components/PhotoGrid";
import { getCollections, getPhotos } from "@/lib/queries";

export default async function WorkPage() {
  const [collections, photos] = await Promise.all([getCollections(), getPhotos()]);

  return (
    <>
      <PageIntro
        eyebrow="Home"
        title={
          <>
            Selected works,
            <br />
            2019 — 2026
          </>
        }
        lead="Fotografía editorial, retrato y arquitectura. Trabajo por encargo con revistas y estudios de diseño, y mantengo un archivo propio que crece viaje a viaje."
      />

      <FilterBar collections={collections} count={photos.length} />
      <PhotoGrid photos={photos} />
      <LoadMore />
    </>
  );
}
