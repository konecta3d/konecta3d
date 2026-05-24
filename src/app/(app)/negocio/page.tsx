import { redirect } from "next/navigation";

/**
 * /negocio → redirige al perfil del negocio
 */
export default function NegocioPage() {
  redirect("/negocio/perfil");
}
