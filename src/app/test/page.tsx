import { redirect } from "next/navigation";

// Página de test eliminada por seguridad (contenía credenciales hardcodeadas).
export default function TestPage() {
  redirect("/admin/dashboard");
}
