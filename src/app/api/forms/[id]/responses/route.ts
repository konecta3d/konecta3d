import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// POST /api/forms/[id]/responses — público, sin auth
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: formId } = await params;
    const body = await req.json();
    const { answers, contactData } = body;

    if (!answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: "answers es requerido y debe ser un array" }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Obtener el formulario para saber el tipo y la configuración
    const { data: form, error: formError } = await supabaseAdmin
      .from("forms")
      .select("id, business_id, type, data_collection, title")
      .eq("id", formId)
      .single();

    if (formError || !form) {
      return NextResponse.json({ error: "Formulario no encontrado" }, { status: 404 });
    }

    let leadId: string | null = null;
    let redirectUrl: string | null = null;

    // Si es captación y hay datos de contacto, crear un lead
    if (form.type === "captacion" && form.data_collection === "name_phone_email" && contactData) {
      const { name, phone, email } = contactData;

      // Validar datos básicos
      if (!name?.trim() && !phone?.trim() && !email?.trim()) {
        return NextResponse.json({ error: "Se requiere al menos nombre, teléfono o email" }, { status: 400 });
      }

      // Crear lead en la tabla leads
      const { data: lead, error: leadError } = await supabaseAdmin
        .from("leads")
        .insert({
          business_id: form.business_id,
          source: `formulario_${formId}`,
          status: "nuevo",
          notes: JSON.stringify({ form_title: form.title, answers }),
          ...(name?.trim() ? { name: name.trim() } : {}),
          ...(phone?.trim() ? { phone: phone.trim() } : {}),
          ...(email?.trim() ? { email: email.trim() } : {}),
        })
        .select()
        .single();

      if (leadError) {
        return NextResponse.json({ error: "Error al guardar lead: " + leadError.message }, { status: 500 });
      }

      leadId = lead.id;
    }

    // Guardar la respuesta en form_responses (siempre, para ambos tipos)
    const { data: response, error: responseError } = await supabaseAdmin
      .from("form_responses")
      .insert({
        form_id: formId,
        business_id: form.business_id,
        lead_id: leadId,
        answers,
        contact_data: form.type === "captacion" ? contactData : null,
        ip_address: req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || null,
      })
      .select()
      .single();

    if (responseError) {
      return NextResponse.json({ error: "Error al guardar respuesta: " + responseError.message }, { status: 500 });
    }

    // Si es fidelización con página de gracias, calcular redirect
    if (form.type === "fidelizacion" && form.data_collection === "thanks_page") {
      redirectUrl = `/l/form-thanks?form=${formId}&response=${response.id}`;
    }

    return NextResponse.json({
      success: true,
      leadId,
      responseId: response.id,
      redirectUrl,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/forms/[id]/responses — listar respuestas (requiere auth de negocio)
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: formId } = await params;
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
      .from("form_responses")
      .select("*")
      .eq("form_id", formId)
      .eq("business_id", businessId)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ responses: data || [] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}