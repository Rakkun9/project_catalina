"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Container } from "./Container";

const NAV = [
  { href: "/", label: "Work" },
];

export function SiteHeader() {
  const pathname = usePathname();

  // "Work" cubre la home y las vistas filtradas por colección.
  const isActive = (href: string) =>
    href === "/"
      ? pathname === "/" || pathname.startsWith("/collections")
      : pathname.startsWith(href);

  return (
    <header className="border-b border-hairline">
      <Container className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-5 pt-8 pb-7">
        <Link href="/" className="flex items-baseline gap-2.5">
          <span className="text-[0.9375rem] font-medium tracking-[0.02em] text-ink">
            Teoría IV
          </span>
          <span
            aria-hidden
            className="size-1 -translate-y-[3px] rounded-full bg-accent"
          />
        </Link>

        <nav aria-label="Principal">
          <ul className="flex items-baseline gap-7 md:gap-11">
            {NAV.map((item) => {
              const active = isActive(item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={
                      active
                        ? "ui-label border-b border-ink pb-1 text-ink"
                        : "ui-label text-muted transition-colors duration-300 hover:text-ink"
                    }
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </Container>
    </header>
  );
}
