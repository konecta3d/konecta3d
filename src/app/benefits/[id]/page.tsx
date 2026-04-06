"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function BenefitPage({ params }: { params: { id: string } }) {
  const [benefit, setBenefit] = useState<any>(null);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("benefits")
        .select("title,description,type,value,conditions,redeem_instructions,pdf_url")
        .eq("id", params.id)
        .single();
      setBenefit(data || null);
    };
    load();
  }, [params.id]);

  if (!benefit) return <div className="min-h-screen p-8">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] p-6">
      <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--card)] p-6 space-y-4">
        <div className="text-xl font-semibold">{benefit.title}</div>
        {benefit.description && <div className="text-sm text-[var(--brand-1)]">{benefit.description}</div>}
        {benefit.value && <div className="text-sm">Valor: {benefit.value}</div>}
        {benefit.conditions?.min_purchase && <div className="text-xs">Gasto mínimo: {benefit.conditions.min_purchase}</div>}
        {benefit.conditions?.expires && <div className="text-xs">Válido hasta: {benefit.conditions.expires}</div>}
        {benefit.redeem_instructions && (
          <div className="text-sm rounded-lg border border-[var(--border)] p-3">
            {benefit.redeem_instructions}
          </div>
        )}
        {benefit.pdf_url && (
          <a
            className="block w-full rounded-lg border border-[var(--border)] px-4 py-2 text-center font-semibold"
            href={benefit.pdf_url}
            target="_blank"
            rel="noreferrer"
          >
            Ver PDF
          </a>
        )}
        <button className="w-full rounded-lg bg-[var(--brand-4)] px-4 py-2 font-semibold text-black">Canjear</button>
      </div>
    </div>
  );
}
