import Link from "next/link";
import { Container } from "./Container";
import type { Collection } from "@/lib/types";

/** Barra de categorías + contador, sobre una línea de 1px. */
export function FilterBar({
  collections,
  activeSlug,
  count,
}: {
  collections: Collection[];
  activeSlug?: string;
  count: number;
}) {
  const item = (href: string, label: string, active: boolean) => (
    <li key={href}>
      <Link
        href={href}
        aria-current={active ? "page" : undefined}
        className={
          active
            ? "ui-label text-ink"
            : "ui-label text-muted transition-colors duration-300 hover:text-ink"
        }
      >
        {label}
      </Link>
    </li>
  );

  return (
    <Container className="flex flex-wrap items-baseline justify-between gap-x-9 gap-y-4 border-b border-hairline pb-5">
      <ul className="flex flex-wrap gap-x-9 gap-y-3">
        {item("/", "All works", !activeSlug)}
        {collections.map((c) =>
          item(`/collections/${c.slug}`, c.title, c.slug === activeSlug),
        )}
      </ul>

      <span className="ui-label text-muted">
        {count} {count === 1 ? "project" : "projects"}
      </span>
    </Container>
  );
}
