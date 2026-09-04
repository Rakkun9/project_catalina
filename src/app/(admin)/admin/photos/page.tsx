import { getAdminCollections, getAdminPhotos } from "@/lib/queries";
import { PhotoManager } from "./PhotoManager";

export const metadata = { title: "Fotos", robots: { index: false, follow: false } };

// El panel siempre muestra el estado real de la base, nunca una versión cacheada.
export const dynamic = "force-dynamic";

export default async function AdminPhotosPage() {
  const [photos, collections] = await Promise.all([getAdminPhotos(), getAdminCollections()]);

  return <PhotoManager initialPhotos={photos} collections={collections} />;
}
