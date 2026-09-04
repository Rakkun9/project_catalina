import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/supabase/session";
import { LoginForm } from "./LoginForm";

export const metadata = {
  title: "Entrar",
  robots: { index: false, follow: false },
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const rawNext = typeof params.next === "string" ? params.next : "/admin/photos";
  const reason = typeof params.reason === "string" ? params.reason : undefined;

  // Sólo rutas internas: `next` viene de la URL y no se puede confiar.
  const next = rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/admin/photos";

  if (await getCurrentUser()) redirect(next);

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-hairline">
        <div className="mx-auto flex w-full max-w-[1440px] items-baseline justify-between px-6 pt-8 pb-7 md:px-10">
          <Link href="/" className="flex items-baseline gap-2.5">
            <span className="text-[0.9375rem] font-medium tracking-[0.02em] text-ink">
              Estudio Catalina
            </span>
            <span aria-hidden className="size-1 -translate-y-[3px] rounded-full bg-accent" />
          </Link>
          <Link
            href="/"
            className="ui-label text-muted transition-colors duration-300 hover:text-ink"
          >
            Volver al sitio
          </Link>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm">
          <p className="ui-eyebrow text-muted">Panel</p>
          <h1 className="display mt-8 text-[clamp(2rem,5vw,2.75rem)]">Entrar al panel</h1>
          <p className="mt-6 mb-14 text-sm leading-[1.7] text-muted">
            Acceso restringido. Si no tenés cuenta, se crea desde el dashboard de
            Supabase.
          </p>

          <LoginForm next={next} reason={reason} />
        </div>
      </main>
    </div>
  );
}
