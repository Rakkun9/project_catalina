import { Container } from "@/components/Container";
import { PageIntro } from "@/components/PageIntro";
import { getCollections } from "@/lib/queries";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { UploadForm } from "./UploadForm";

export const metadata = { title: "Upload", robots: { index: false, follow: false } };

export default async function UploadPage() {
  const collections = await getCollections();

  return (
    <>
      <PageIntro
        eyebrow="Home / Upload"
        title="Subir una foto al archivo"
        lead="La imagen va al bucket de Supabase y la ficha queda publicada en la grilla. La proporción define el espacio que ocupa la tarjeta."
      />

      <Container className="border-t border-hairline pt-14 pb-24 md:pt-20 md:pb-32">
        <UploadForm collections={collections} configured={isSupabaseConfigured()} />
      </Container>
    </>
  );
}
