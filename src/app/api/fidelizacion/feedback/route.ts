import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyBusinessOwnership, verifyAdminSession } from "@/lib/auth-helpers";

function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// GET /api/fidelizacion/feedback?formId=xxx — requiere auth del negocio
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const formId = searchParams.get("formId");
  if (!formId) return NextResponse.json({ error: "formId requerido" }, { status: 400 });

  const db = supabaseAdmin();

  const { data: form } = await db
    .from("fidelizacion_forms")
    .select("business_id")
    .eq("id", formId)
    .single();

  if (!form) return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 });

  const [owns, { isAdmin }] = await Promise.all([
    verifyBusinessOwnership(req, form.business_id),
    verifyAdminSession(req),
  ]);
  if (!owns && !isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 403 });

  const { data, error } = await db
    .from("fidelizacion_feedback")
    .select("*")
    .eq("form_id", formId)
    .order("submitted_at", { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ feedback: data ?? [] });
}

// POST /api/fidelizacion/feedback — pública, sin autenticación requerida
export async function POST(req: Request) {
  const body = await req.json();
  const { formId, answers, respondentName, respondentEmail } = body as {
    formId: string;
    answers: Record<string, unknown>;
    respondentName?: string;
    respondentEmail?: string;
  };

  if (!formId) {
    return NextResponse.json({ error: "formId es obligatorio" }, { status: 400 });
  }

  const db = supabaseAdmin();

  // 1. Buscar el formulario por id
  const { data: form, error: formError } = await db
    .from("fidelizacion_forms")
    .select("id, business_id, status, blocks")
    .eq("id", formId)
    .single();

  if (formError || !form) {
    return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 });
  }

  if (form.status !== "published") {
    return NextResponse.json({ error: "Este formulario no está disponible" }, { status: 404 });
  }

  // 2. Calcular nps_score: extraer de answers el bloque fid_nps
  let npsScore: number | null = null;
  let avgRating: number | null = null;

  if (answers && typeof answers === "object") {
    // NPS: buscamos una key con "nps" en el nombre o formato { blockId: number }
    for (const [key, val] of Object.entries(answers)) {
      if (key.includes("nps") && typeof val === "number") {
        npsScore = val;
      }
    }

    // Ratings: buscamos keys que empiecen por "rating_" y promediamos
    const ratingVals: number[] = [];
    for (const [key, val] of Object.entries(answers)) {
      if (key.startsWith("rating_") && typeof val === "number") {
        ratingVals.push(val);
      }
    }
    if (ratingVals.length > 0) {
      const sum = ratingVals.reduce((a, b) => a + b, 0);
      avgRating = Math.round((sum / ratingVals.length) * 100) / 100;
    }
  }

  // 3. Insertar feedback
  const { error: insertError } = await db
    .from("fidelizacion_feedback")
    .insert({
      form_id:          formId,
      business_id:      form.business_id,
      respondent_name:  respondentName  || null,
      respondent_email: respondentEmail || null,
      answers:          answers ?? {},
      nps_score:        npsScore,
      avg_rating:       avgRating,
    });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  // 4. Incrementar response_count con UPDATE directo
  const currentCount = typeof (form as Record<string, unknown>).response_count === "number"
    ? (form as Record<string, unknown>).response_count as number
    : 0;
  await db
    .from("fidelizacion_forms")
    .update({ response_count: currentCount + 1 })
    .eq("id", formId);

  return NextResponse.json({ ok: true });
}
