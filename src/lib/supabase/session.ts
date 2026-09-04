import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from "./config";

/**
 * Cliente ligado a la sesión del usuario (cookies). Todo lo que escribe el panel
 * pasa por acá, así RLS valida cada operación contra `auth.uid()`.
 *
 * En un React Server Component no se pueden escribir cookies: `setAll` falla y se
 * ignora a propósito. El refresco del token lo hace `src/middleware.ts`.
 */
export async function getSupabaseSessionClient(): Promise<SupabaseClient | null> {
  if (!isSupabaseConfigured()) return null;

  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (cookiesToSet) => {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Llamado desde un RSC. El middleware ya refrescó la sesión.
        }
      },
    },
  });
}

/** Usuario autenticado, o `null`. Verificado contra el servidor de Auth. */
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await getSupabaseSessionClient();
  if (!supabase) return null;

  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}
