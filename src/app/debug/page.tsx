import { redirect } from "next/navigation";

// Página de debug eliminada por seguridad.
export default function DebugPage() {
  redirect("/admin/dashboard");
}
