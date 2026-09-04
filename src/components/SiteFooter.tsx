import Link from "next/link";
import { Container } from "./Container";

const LINKS = [
  { href: "https://instagram.com", label: "Instagram" },
  { href: "https://behance.net", label: "Behance" },
  { href: "mailto:hola@prueba.photo", label: "Mail" },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-hairline py-9">
      <Container className="flex flex-wrap items-baseline justify-between gap-x-9 gap-y-5">
        <span className="ui-label text-muted">Teoría IV</span>

        <div className="flex flex-wrap gap-x-9 gap-y-3">
          {LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="ui-label text-muted transition-colors duration-300 hover:text-ink"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/upload"
            className="ui-label text-muted transition-colors duration-300 hover:text-ink"
          >
            Upload
          </Link>
        </div>

        <span className="ui-label text-muted">© {new Date().getFullYear()}</span>
      </Container>
    </footer>
  );
}
