import type { ReactNode } from "react";
import { Container } from "./Container";

/** Eyebrow + título display a la izquierda, párrafo corto a la derecha. */
export function PageIntro({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <Container className="grid grid-cols-1 items-end gap-x-20 gap-y-12 pt-16 pb-14 md:grid-cols-[7fr_4fr] md:pt-24 md:pb-[4.5rem]">
      <div>
        <p className="ui-eyebrow text-muted">{eyebrow}</p>
        <h1 className="display mt-10 text-[clamp(2.75rem,6.4vw,5.75rem)] md:mt-14">
          {title}
        </h1>
      </div>

      {lead ? (
        <p className="max-w-[34ch] text-[0.9375rem] leading-[1.7] text-balance text-muted md:mb-3">
          {lead}
        </p>
      ) : null}
    </Container>
  );
}
