import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
        // Cookies de sesión en path "/" → compartidas entre todas las rutas
        // y pestañas del mismo dominio. SameSite "lax" permite mantener la
        // sesión al abrir el enlace en una pestaña nueva.
        cookieOptions: {
            path: "/",
            sameSite: "lax",
            maxAge: 60 * 60 * 24 * 30, // 30 días
        },
    }
);
