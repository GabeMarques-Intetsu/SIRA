import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";

/** Rotas públicas do grupo (auth) — acessíveis sem sessão. */
const AUTH_ROUTES = ["/login", "/cadastro"];

/**
 * Refresca a sessão do Supabase em cada request e aplica a proteção de rotas.
 * Padrão oficial @supabase/ssr para Next.js App Router: o middleware reescreve
 * os cookies de auth tanto no request (p/ Server Components a jusante) quanto
 * na response (p/ o browser).
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // IMPORTANTE: getUser() revalida o token no servidor de auth — não usar
  // getSession() para decisões de proteção (cookie é forjável).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // Não autenticado tentando acessar rota de app → manda para o login.
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Autenticado em /login ou /cadastro → manda para a área logada.
  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/calendario";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
