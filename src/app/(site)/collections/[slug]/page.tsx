import { notFound } from "next/navigation";
import { FilterBar } from "@/components/FilterBar";
import { LoadMore } from "@/components/LoadMore";
import { PageIntro } from "@/components/PageIntro";
import { PhotoGrid } from "@/components/PhotoGrid";
import { getCollection, getCollections, getPhotos } from "@/lib/queries";

export async function generateStaticParams() {
  const collections = await getCollections();
  return collections.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const collection = await getCollection(slug);
  return { title: collection?.title ?? "Collection" };
}

export default async function CollectionPage({ params }: PageProps<"/collections/[slug]">) {
  const { slug } = await params;
  const [collection, collections, photos] = await Promise.all([
    getCollection(slug),
    getCollections(),
    getPhotos(slug),
  ]);
  if (!collection) notFound();

  return (
    <>
      <PageIntro
        eyebrow={`Home / ${collection.title}`}
        title={collection.title}
        lead={collection.description ?? undefined}
      />

      <FilterBar collections={collections} activeSlug={slug} count={photos.length} />
      <PhotoGrid photos={photos} />
      <LoadMore />
    </>
  );
}
