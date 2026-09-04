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
            Caprichos Bogotanos
          </>
        }
        lead="Experimentaciones del curso teoría IV. Imagina algún Capricho Bogotano, -de seguro- ya habita en tu mente."
      />

      <FilterBar collections={collections} count={photos.length} />
      <PhotoGrid photos={photos} />
      <LoadMore />
    </>
  );
}
