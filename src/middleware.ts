import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

/**
 * Refresca la cookie de sesión y bloquea `/admin/*` sin sesión.
 *
 * `supabase.auth.getUser()` no se puede omitir ni reemplazar por `getSession()`:
 * es lo único que valida el token contra el servidor de Auth en lugar de confiar
 * en la cookie, que el cliente puede falsificar.
 */
export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  // Sin Supabase configurado no hay sesión posible: el panel queda inaccesible.
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return redirectToLogin(request, "unconfigured");
  }

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (cookiesToSet) => {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirectToLogin(request);

  return response;
}

function redirectToLogin(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";
  url.search = "";
  url.searchParams.set("next", request.nextUrl.pathname);
  if (reason) url.searchParams.set("reason", reason);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*"],
};
