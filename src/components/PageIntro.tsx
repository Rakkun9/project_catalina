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
    <Container className="grid grid-cols-1 items-end gap-x-20 gap-y-12 pt-1 pb-14 md:grid-cols-[7fr_4fr] md:pt-12 md:pb-[2.5rem]">
      <div>
        <p className="ui-eyebrow text-muted">{eyebrow}</p>
        <h1 className="display mt-5 text-[clamp(2.75rem,4.9vw,4.75rem)] md:mt-14 font-black">
          {title}
        </h1>
        {lead ? (
          <p className="max-w-[34ch] text-[0.9375rem] leading-[1.7] text-balance text-muted md:mb-3 mt-10">
            {lead}
          </p>
        ) : null}
      </div>
    </Container>
  );
}
