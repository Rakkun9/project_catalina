"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { uploadPhoto, type UploadState } from "./actions";
import { RATIOS } from "./formats";
import type { Collection } from "@/lib/types";

const initialState: UploadState = { status: "idle", message: "" };

const fieldClass =
  "w-full border-0 border-b border-hairline bg-transparent py-3 text-[0.9375rem] text-ink outline-none transition-colors duration-300 placeholder:text-muted focus:border-ink";

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="ui-label text-muted">{label}</span>
      {hint ? <span className="ml-3 text-xs text-muted">{hint}</span> : null}
      <div className="mt-3">{children}</div>
    </label>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="ui-label border border-ink px-9 py-4 text-ink transition-colors duration-300 hover:bg-ink hover:text-paper disabled:cursor-not-allowed disabled:border-hairline disabled:text-muted disabled:hover:bg-transparent"
    >
      {pending ? "Subiendo…" : "Publicar foto"}
    </button>
  );
}

export function UploadForm({
  collections,
  configured,
}: {
  collections: Collection[];
  configured: boolean;
}) {
  const [state, formAction] = useActionState(uploadPhoto, initialState);

  return (
    <form action={formAction} className="max-w-2xl">
      {!configured ? (
        <p className="mb-14 border-l border-hairline py-2 pl-6 text-sm leading-relaxed text-muted">
          Supabase todavía no está conectado. Completá <code>.env.local</code> y
          corré el script de <code>supabase/schema.sql</code> antes de subir.
        </p>
      ) : null}

      <div className="space-y-11">
        <Field label="Imagen" hint="JPG, PNG, WebP o AVIF · máx. 15 MB">
          <input
            type="file"
            name="file"
            accept="image/jpeg,image/png,image/webp,image/avif"
            required
            className="w-full text-sm text-muted file:mr-6 file:border file:border-hairline file:bg-transparent file:px-6 file:py-3 file:text-[0.6875rem] file:uppercase file:tracking-[0.18em] file:text-ink hover:file:border-ink"
          />
        </Field>

        <Field label="Label" hint="se muestra en mayúsculas bajo la foto">
          <input type="text" name="label" required placeholder="Proyecto 19" className={fieldClass} />
        </Field>

        <Field label="Dato corto" hint="opcional — categoría y número">
          <input type="text" name="meta" placeholder="Editorial · 24" className={fieldClass} />
        </Field>

        <Field label="Texto alternativo" hint="opcional — descripción para lectores de pantalla">
          <input type="text" name="alt" placeholder="Fachada modular al atardecer" className={fieldClass} />
        </Field>

        <Field label="Categoría">
          <select name="collection_id" className={`${fieldClass} cursor-pointer`} defaultValue="">
            <option value="">Sin categoría</option>
            {collections.map((collection) => (
              <option key={collection.id} value={collection.id}>
                {collection.title}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Proporción" hint="define el alto de la tarjeta en la grilla">
          <select name="ratio" className={`${fieldClass} cursor-pointer`} defaultValue="3 / 4">
            {RATIOS.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.name} — {ratio.value}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Código de acceso">
          <input type="password" name="code" required autoComplete="off" className={fieldClass} />
        </Field>
      </div>

      <div className="mt-14 flex flex-wrap items-center gap-8">
        <SubmitButton />
        {state.status !== "idle" ? (
          <p
            role="status"
            className={`text-sm ${state.status === "ok" ? "text-ink" : "text-accent"}`}
          >
            {state.message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
