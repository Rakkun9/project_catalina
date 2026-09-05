import Link from "next/link";
import type { ReactNode } from "react";
import { getCurrentUser } from "@/lib/supabase/session";
import { signOut } from "./actions";

const NAV = [
  { href: "/admin/photos", label: "Fotos" },
  { href: "/admin/photos/upload", label: "Subir" },
  { href: "/admin/categories", label: "Categorías" },
];

export default async function AdminShell({ children }: { children: ReactNode }) {
  // El middleware ya bloqueó el acceso; esto sólo es para mostrar el email.
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-hairline bg-paper/90 backdrop-blur-sm">
        <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-baseline justify-between gap-x-8 gap-y-4 px-6 pt-6 pb-5 md:px-10">
          <div className="flex flex-wrap items-baseline gap-x-9 gap-y-3">
            <Link href="/admin/photos" className="flex items-baseline gap-2.5">
              <span className="text-[0.9375rem] font-medium tracking-[0.02em] text-ink">
                Estudio Catalina
              </span>
              <span aria-hidden className="size-1 -translate-y-[3px] rounded-full bg-accent" />
            </Link>
            <nav aria-label="Panel">
              <ul className="flex gap-x-7">
                {NAV.map((item) => (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="ui-label text-muted transition-colors duration-300 hover:text-ink"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          <div className="flex flex-wrap items-baseline gap-x-7 gap-y-3">
            {user?.email ? (
              <span className="ui-label text-tile-label">{user.email}</span>
            ) : null}
            <Link
              href="/"
              className="ui-label text-muted transition-colors duration-300 hover:text-ink"
            >
              Ver sitio
            </Link>
            <form action={signOut}>
              <button
                type="submit"
                className="ui-label cursor-pointer text-muted transition-colors duration-300 hover:text-ink"
              >
                Salir
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>
    </div>
  );
}
