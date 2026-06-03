import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Rutas que requieren estar logueado
const PROTECTED_PREFIXES = [
  "/dashboard",
  "/admin",
  "/landing",
  "/lead-magnet",
  "/vip-benefits",
  "/whatsapp-generator",
  "/documents",
  "/settings",
  "/business/dashboard",
  "/business/select-profile",
  "/mi-negocio",
  "/formularios",
  "/acciones",
  "/gpt-fidelizacion",
  "/ayuda",
  // Módulo de captación
  "/captacion",
  // Panel alternativo de negocio
  "/negocio",
  "/mi-contexto",
  // Debug/test — solo admin, proteger para evitar exposición
  "/debug",
  "/test",
];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Solo proteger rutas del panel interno
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // La ruta de login del negocio no se protege
  if (pathname === "/business/login") return NextResponse.next();

  // Respuesta mutable: cuando Supabase refresca el token, reescribe las cookies
  // aquí para que la sesión se mantenga viva entre pestañas y recargas.
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser() revalida el token contra Supabase y, si hace falta, lo refresca
  // y reescribe las cookies (vía setAll). getSession() no hace esto en servidor,
  // por eso una pestaña nueva podía acabar pidiendo login de nuevo.
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    // Si viene de /business/*, redirigir a login de negocio
    if (pathname.startsWith("/business")) {
      return NextResponse.redirect(new URL("/business/login", req.url));
    }
    // Si viene del panel admin, redirigir al login general
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|l/|api/).*)",
  ],
};
