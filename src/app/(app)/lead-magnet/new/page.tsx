"use client";

import { useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RedirectToWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Redirigir manteniendo los parámetros de query relevantes
    const params = new URLSearchParams();
    const businessId = searchParams.get("businessId");
    const edit = searchParams.get("edit");
    if (businessId) params.set("businessId", businessId);
    if (edit) { params.set("edit", edit); params.set("step", "tipo"); }
    const query = params.toString();
    router.replace(`/lead-magnet/wizard${query ? `?${query}` : ""}`);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center text-sm text-white/50">
      Redirigiendo al asistente...
    </div>
  );
}

export default function LeadMagnetNewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-sm">Cargando...</div>}>
      <RedirectToWizard />
    </Suspense>
  );
}
