import Link from "next/link";
import { getAdminCollections } from "@/lib/queries";
import { UploadClient } from "./UploadClient";

export const metadata = { title: "Subir fotos", robots: { index: false, follow: false } };

export const dynamic = "force-dynamic";

export default async function UploadPage() {
  const collections = await getAdminCollections();

  return (
    <div className="mx-auto w-full max-w-[1440px] px-6 py-12 md:px-10 md:py-16">
      <div className="flex flex-wrap items-end justify-between gap-x-10 gap-y-6">
        <div>
          <p className="ui-eyebrow text-muted">Panel / Subir</p>
          <h1 className="display mt-6 text-[clamp(1.75rem,4vw,2.5rem)]">
            Subir fotos al archivo
          </h1>
          <p className="mt-6 max-w-[52ch] text-[0.9375rem] leading-[1.7] text-muted">
            Cada archivo se reescala a 2400px de ancho y se convierte a WebP en tu
            navegador antes de subirse. La proporción de la tarjeta se detecta de
            las dimensiones reales; podés corregirla acá o después, desde la lista.
          </p>
        </div>

        <Link
          href="/admin/photos"
          className="ui-label border-b border-hairline pb-1.5 text-muted transition-colors duration-300 hover:border-ink hover:text-ink"
        >
          Volver a la lista
        </Link>
      </div>

      <div className="mt-14">
        <UploadClient collections={collections} />
      </div>
    </div>
  );
}
