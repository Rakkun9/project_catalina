import { Container } from "@/components/Container";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Journal" };

const ENTRIES = [
  { n: "05", title: "Volver a Kioto en invierno", meta: "Notas de viaje", date: "Ago 2026" },
  { n: "04", title: "Sobre revelar en frío", meta: "Proceso", date: "Jun 2026" },
  { n: "03", title: "Diez días sin trípode", meta: "Notas de viaje", date: "Mar 2026" },
  { n: "02", title: "Qué guardo y qué descarto", meta: "Proceso", date: "Dic 2025" },
  { n: "01", title: "Empezar un archivo", meta: "Estudio", date: "Sep 2025" },
];

export default function JournalPage() {
  return (
    <>
      <PageIntro
        eyebrow="Home / Journal"
        title={
          <>
            Notas sueltas
            <br />
            sobre el oficio
          </>
        }
        lead="Textos cortos sobre viajes, proceso y decisiones de edición. Se publican cuando hay algo que valga la pena contar."
      />

      <Container className="pb-24 md:pb-32">
        <ul className="border-t border-hairline">
          {ENTRIES.map((entry) => (
            <li key={entry.n} className="border-b border-hairline">
              <article className="group flex flex-col gap-3 py-7 md:flex-row md:items-baseline md:gap-10 md:py-9">
                <span className="ui-tile-label font-mono text-muted md:w-10">{entry.n}</span>
                <h2 className="flex-1 text-xl font-light tracking-[-0.02em] text-ink md:text-[1.75rem]">
                  {entry.title}
                </h2>
                <span className="ui-label text-muted md:w-40">{entry.meta}</span>
                <span className="ui-label text-muted md:w-24 md:text-right">{entry.date}</span>
              </article>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
