import { Container } from "@/components/Container";
import { PageIntro } from "@/components/PageIntro";

export const metadata = { title: "Contact" };

const CHANNELS = [
  { label: "Email", value: "hola@prueba.photo", href: "mailto:Prueba" },
  { label: "Instagram", value: "@estudio.prueba", href: "https://instagram.com" },
  { label: "Teléfono", value: "+54 11 0000 0000", href: "tel:+541100000000" },
];

export default function ContactPage() {
  return (
    <>
      <PageIntro
        eyebrow="Home / Contact"
        title={
          <>
            Encargos, copias
            <br />
            y colaboraciones
          </>
        }
        lead="Contame en dos líneas qué necesitás, dónde y cuándo. Respondo dentro de las 48 horas hábiles."
      />

      <Container className="pb-24 md:pb-32">
        <ul className="border-t border-hairline">
          {CHANNELS.map((channel) => (
            <li key={channel.label} className="border-b border-hairline">
              <a
                href={channel.href}
                className="group flex flex-col gap-2 py-8 md:flex-row md:items-baseline md:justify-between md:py-10"
              >
                <span className="ui-label text-muted">{channel.label}</span>
                <span className="display text-2xl transition-opacity duration-300 group-hover:opacity-55 md:text-[2.25rem]">
                  {channel.value}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </Container>
    </>
  );
}
