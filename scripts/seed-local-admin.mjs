/**
 * Crea el usuario admin en Supabase local.
 * Ejecutar UNA SOLA VEZ después de arrancar Supabase local por primera vez.
 *
 * Uso:
 *   node scripts/seed-local-admin.mjs
 *
 * Requiere que Supabase local esté corriendo:
 *   npx supabase start
 */

const SUPABASE_URL = "http://127.0.0.1:54321";
const SERVICE_ROLE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const ADMIN_EMAIL = "info@konecta3d.com";
const ADMIN_PASSWORD = "Admin1234!"; // Cambia esto si quieres

async function main() {
  console.log(`Creando usuario admin: ${ADMIN_EMAIL}`);

  const res = await fetch(`${SUPABASE_URL}/auth/v1/admin/users`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    }),
  });

  const data = await res.json();

  if (!res.ok) {
    if (data.msg?.includes("already") || data.code === "email_exists") {
      console.log("El usuario ya existe. Prueba a hacer login.");
    } else {
      console.error("Error:", data);
    }
    return;
  }

  console.log("\nUsuario creado correctamente.");
  console.log(`  Email:      ${ADMIN_EMAIL}`);
  console.log(`  Contraseña: ${ADMIN_PASSWORD}`);
  console.log("\nAhora puedes hacer login en http://localhost:3012/login");
  console.log("Cambia la contraseña desde el panel Admin una vez dentro.");
}

main().catch(console.error);
