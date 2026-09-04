import Link from "next/link";
import { Container } from "./Container";

export function LoadMore({ href = "#" }: { href?: string }) {
  return (
    <Container className="flex justify-center pt-10 pb-24">
      <Link
        href={href}
        className="ui-label border-b border-hairline pb-1.5 text-muted transition-colors duration-300 hover:border-ink hover:text-ink"
      >
        Load more works
      </Link>
    </Container>
  );
}
