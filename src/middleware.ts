import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

// Rutas que requieren estar logueado
const PROTECTED_PREFIXES = ["/dashboard", "/admin", "/landing", "/lead-magnet", "/vip-benefits", "/whatsapp-generator", "/documents", "/settings", "/business/dashboard"];

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  // Solo proteger rutas del panel interno
  const isProtected = PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  // La ruta de login del negocio no se protege
  if (pathname === "/business/login") return NextResponse.next();

  const res = NextResponse.next();

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            req.cookies.set(name, value);
            res.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
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
