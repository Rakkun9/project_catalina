"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export function LoginForm({ next, reason }: { next: string; reason?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(
    reason === "unconfigured"
      ? "Supabase no está configurado. Completá .env.local antes de entrar."
      : null,
  );
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      setError("Supabase no está configurado. Completá .env.local antes de entrar.");
      return;
    }

    setPending(true);
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    setPending(false);

    if (signInError) {
      // Supabase devuelve el mismo error para mail inexistente y clave errada,
      // que es lo correcto: no confirma si la cuenta existe.
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email o contraseña incorrectos."
          : signInError.message,
      );
      return;
    }

    // refresh() hace que el middleware y los RSC vean la cookie recién escrita.
    router.replace(next);
    router.refresh();
  }

  const field =
    "w-full border-0 border-b border-hairline bg-transparent py-3 text-[0.9375rem] text-ink outline-none transition-colors duration-300 placeholder:text-muted focus:border-ink";

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="space-y-10">
        <label className="block">
          <span className="ui-label text-muted">Email</span>
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={`mt-3 ${field}`}
          />
        </label>

        <label className="block">
          <span className="ui-label text-muted">Contraseña</span>
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={`mt-3 ${field}`}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="ui-label mt-12 w-full border border-ink py-4 text-ink transition-colors duration-300 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-hairline disabled:text-muted disabled:hover:bg-transparent"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>

      {error ? (
        <p role="alert" className="mt-6 text-sm leading-relaxed text-accent">
          {error}
        </p>
      ) : null}
    </form>
  );
}
