import { Container } from "@/components/Container";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Studio" };

const FACTS = [
  { label: "Base", value: "Buenos Aires, Argentina" },
  { label: "Trabajo", value: "Editorial, retrato, arquitectura" },
  { label: "Cámaras", value: "Fujifilm X-T5 · Contax T2" },
  { label: "Desde", value: "2019" },
];

export default function StudioPage() {
  return (
    <>
      <PageIntro
        eyebrow="Home / Studio"
        title={
          <>
            Un archivo hecho
            <br />
            de encargos y viajes
          </>
        }
        lead="Sin dirección de arte ni set: luz natural, una cámara chica y el tiempo que haga falta hasta que el lugar se queda quieto."
      />

      <Container className="grid grid-cols-1 gap-x-20 gap-y-16 border-t border-hairline pt-14 pb-24 md:grid-cols-[7fr_4fr] md:pt-20 md:pb-32">
        <div className="max-w-[62ch] space-y-8 text-[0.9375rem] leading-[1.85] text-ink">
          <p>
            Trabajo sobre todo en calle, paisaje y arquitectura. Me interesan los
            momentos en los que un lugar queda vacío por unos segundos y muestra
            su estructura: una escalera, una pared blanca, el mar al mediodía.
          </p>
          <p>
            Las series de este archivo se arman solas. Vuelvo de un viaje con
            doscientas fotos, sobreviven ocho, y esas ocho terminan contando algo
            que no había visto mientras las sacaba.
          </p>
          <p>
            Tomo encargos editoriales y comerciales, y colaboro con revistas y
            estudios de diseño. Si te interesa trabajar juntos, escribime.
          </p>
        </div>

        <dl className="h-fit border-t border-hairline">
          {FACTS.map((fact) => (
            <div
              key={fact.label}
              className="flex items-baseline justify-between gap-6 border-b border-hairline py-4"
            >
              <dt className="ui-label text-muted">{fact.label}</dt>
              <dd className="text-right text-[0.8125rem] text-ink">{fact.value}</dd>
            </div>
          ))}
        </dl>
      </Container>
    </>
  );
}
