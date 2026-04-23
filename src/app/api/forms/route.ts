import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const businessId = searchParams.get("businessId");

    if (!businessId) {
      return NextResponse.json({ error: "businessId requerido" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from("forms")
      .select("id, title, type, objective, basis, active, created_at")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ forms: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { business_id, title, type, objective, basis, questions, data_collection, thanks_message } = body;

    if (!business_id) {
      return NextResponse.json({ error: "business_id requerido" }, { status: 400 });
    }

    if (!title?.trim()) {
      return NextResponse.json({ error: "El título es obligatorio" }, { status: 400 });
    }

    if (!type || !["captacion", "fidelizacion"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido: usar 'captacion' o 'fidelizacion'" }, { status: 400 });
    }

    if (!objective?.trim()) {
      return NextResponse.json({ error: "El objetivo es obligatorio" }, { status: 400 });
    }

    if (!basis || !["producto_servicio", "info_experiencia"].includes(basis)) {
      return NextResponse.json({ error: "Base inválida: usar 'producto_servicio' o 'info_experiencia'" }, { status: 400 });
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json({ error: "Se requiere al menos una pregunta" }, { status: 400 });
    }

    if (questions.length > 3) {
      return NextResponse.json({ error: "Máximo 3 preguntas permitidas" }, { status: 400 });
    }

    if (!data_collection || !["name_phone_email", "anonymous", "thanks_page"].includes(data_collection)) {
      return NextResponse.json({ error: "data_collection inválido" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseAdmin
      .from("forms")
      .insert({
        business_id,
        title,
        type,
        objective,
        basis,
        questions,
        data_collection,
        thanks_message,
        active: true,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ form: data, success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}