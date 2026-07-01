import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "./database.types";
import { needsMfaChallenge } from "@/lib/mfa";

/** Rotas públicas do grupo (auth) — acessíveis sem sessão. */
const AUTH_ROUTES = ["/login", "/cadastro"];

/** Tela de desafio de 2FA (acessível em aal1 pendente; F-39 US39.4). */
const VERIFY_2FA_ROUTE = "/verificar-2fa";

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
  const isVerify2fa = pathname === VERIFY_2FA_ROUTE;

  // Não autenticado tentando acessar rota protegida (inclui /verificar-2fa,
  // que exige sessão) → manda para o login.
  if (!user && !isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (user) {
    // Gate de 2FA (F-39 US39.4 · ADR-010): sessão em aal1 com fator verificado
    // (nextLevel=aal2) precisa do desafio ANTES de qualquer área interna. Como
    // roda em toda request, cobre login/refresh/deep-link — ponto único.
    const { data: aal } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    const pending2fa = needsMfaChallenge(aal);

    if (pending2fa && !isVerify2fa) {
      // Bloqueia TUDO (app + /login + /cadastro) até verificar o 2FA (CA12).
      const url = request.nextUrl.clone();
      url.pathname = VERIFY_2FA_ROUTE;
      return NextResponse.redirect(url);
    }
    if (!pending2fa && isVerify2fa) {
      // Já em aal2 ou sem 2FA → não deve ficar na tela de desafio.
      const url = request.nextUrl.clone();
      url.pathname = "/calendario";
      return NextResponse.redirect(url);
    }
    // Autenticado (sem 2FA pendente) em /login ou /cadastro → área logada.
    if (!pending2fa && isAuthRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/calendario";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
