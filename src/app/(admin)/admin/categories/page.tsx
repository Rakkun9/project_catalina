import { getAdminCollections, getAdminPhotos } from "@/lib/queries";
import { CategoryManager } from "./CategoryManager";

export const metadata = { title: "Categorías", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function AdminCategoriesPage() {
  const [collections, photos] = await Promise.all([getAdminCollections(), getAdminPhotos()]);

  // Cuántas fotos cuelgan de cada categoría, para avisarlo antes de borrar.
  const counts: Record<string, number> = {};
  for (const photo of photos) {
    if (photo.collectionId) counts[photo.collectionId] = (counts[photo.collectionId] ?? 0) + 1;
  }

  return <CategoryManager initialCollections={collections} counts={counts} />;
}
