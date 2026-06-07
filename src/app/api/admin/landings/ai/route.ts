import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/auth-helpers";
import { newBlock, LandingBlock } from "@/lib/landing/blocks";
import { DEFAULT_CLIENT_PROFILE } from "@/lib/crm/client-profile";
import { COPY_FOUNDATION, MENTORS, AI_BLOCK_SPEC } from "@/lib/landing/ai-context";
import { DEFAULT_AI_BRAIN, brainToPrompt } from "@/lib/landing/ai-brain";

export const runtime = "nodejs";
export const maxDuration = 60;

function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

const str = (v: unknown) => (typeof v === "string" ? v : "");
const ALLOWED = new Set<LandingBlock["type"]>(["heading", "paragraph", "bullets", "button", "cards", "steps", "faq", "logos", "countdown", "spacer"]);

/** Convierte la salida cruda de la IA en bloques válidos del editor. */
function sanitize(raw: unknown): LandingBlock[] {
  const obj = raw as { blocks?: unknown[] };
  if (!obj || !Array.isArray(obj.blocks)) return [];
  const out: LandingBlock[] = [];
  for (const item of obj.blocks) {
    const b = item as Record<string, unknown>;
    const t = b?.type as LandingBlock["type"];
    if (!t || !ALLOWED.has(t)) continue;
    const merged = newBlock(t) as unknown as Record<string, unknown>;
    if (typeof b.align === "string") merged.align = b.align;
    if (typeof b.padY === "string") merged.padY = b.padY;
    if (typeof b.bg === "string") merged.bg = b.bg;
    switch (t) {
      case "heading":
        merged.text = str(b.text); merged.level = [1, 2, 3].includes(b.level as number) ? b.level : 2; merged.accent = !!b.accent; break;
      case "paragraph":
        merged.text = str(b.text); if (typeof b.size === "string") merged.size = b.size; break;
      case "bullets":
        merged.items = Array.isArray(b.items) ? b.items.map(str).filter(Boolean) : []; break;
      case "button":
        merged.label = str(b.label) || "Botón"; merged.linkType = (b.linkType as string) || "whatsapp";
        merged.value = str(b.value) || "34623759451"; merged.waMessage = str(b.waMessage);
        merged.style = (b.style as string) || "gold"; merged.size = (b.size as string) || "lg"; break;
      case "cards":
        merged.columns = [2, 3].includes(b.columns as number) ? b.columns : 2;
        merged.items = (Array.isArray(b.items) ? b.items : []).map((x) => { const o = x as Record<string, unknown>; return { icon: str(o.icon), title: str(o.title), text: str(o.text) }; }); break;
      case "steps":
        merged.items = (Array.isArray(b.items) ? b.items : []).map((x) => { const o = x as Record<string, unknown>; return { title: str(o.title), text: str(o.text) }; }); break;
      case "faq":
        merged.items = (Array.isArray(b.items) ? b.items : []).map((x) => { const o = x as Record<string, unknown>; return { q: str(o.q), a: str(o.a) }; }); break;
      case "logos":
        merged.title = str(b.title) || "Negocios que ya confían en nosotros"; merged.items = []; break;
      case "countdown":
        merged.label = str(b.label); merged.target = ""; break;
      case "spacer":
        merged.height = Number(b.height) || 40; break;
    }
    out.push(merged as unknown as LandingBlock);
  }
  return out;
}

function parseJson(text: string): unknown {
  let t = text.trim();
  // quitar vallas de markdown si las hubiera
  t = t.replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  const start = t.indexOf("{");
  const end = t.lastIndexOf("}");
  if (start >= 0 && end > start) t = t.slice(start, end + 1);
  return JSON.parse(t);
}

export async function POST(req: Request) {
  const { isAdmin } = await verifyAdminSession(req);
  if (!isAdmin) return NextResponse.json({ error: "No autorizado" }, { status: 401 });

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: "Falta la clave ANTHROPIC_API_KEY en el servidor (configúrala en Vercel)." }, { status: 503 });
  }

  try {
    const body = await req.json();
    const objective = str(body.objective).trim();
    const audience = str(body.audience).trim();
    const mentorKey = str(body.mentor);
    const notes = str(body.notes).trim();
    if (!objective) return NextResponse.json({ error: "El objetivo es obligatorio" }, { status: 400 });

    // Perfil de cliente ideal + cerebro de voz (guardados o por defecto)
    let profile = DEFAULT_CLIENT_PROFILE;
    let brain = DEFAULT_AI_BRAIN;
    try {
      const db = adminClient();
      const [{ data: pData }, { data: bData }] = await Promise.all([
        db.from("settings").select("value").eq("key", "crm_client_profile").single(),
        db.from("settings").select("value").eq("key", "landing_ai_brain").single(),
      ]);
      if (pData?.value) profile = { ...DEFAULT_CLIENT_PROFILE, ...(typeof pData.value === "string" ? JSON.parse(pData.value) : pData.value) };
      if (bData?.value) brain = { ...DEFAULT_AI_BRAIN, ...(typeof bData.value === "string" ? JSON.parse(bData.value) : bData.value) };
    } catch { /* usa los valores por defecto */ }

    // Mentores seleccionados
    const mentorBlocks: string[] = [];
    if (mentorKey === "ambos") mentorBlocks.push(MENTORS.hormozi.profile, MENTORS["isra-bravo"].profile);
    else if (MENTORS[mentorKey]) mentorBlocks.push(MENTORS[mentorKey].profile);

    const profileText = `CLIENTE IDEAL (${profile.nombre}): ${profile.descripcion}
Dolores: ${profile.dolores.slice(0, 6).join(" · ")}
Deseos: ${profile.deseos.slice(0, 6).join(" · ")}
Miedos: ${profile.miedos.join(" · ")}
Objeciones: ${profile.objeciones.map((o) => o.objecion).join(" · ")}`;

    const system = [
      "Eres un copywriter de conversión experto que diseña landing pages para Konecta3D.",
      mentorBlocks.length ? "Escribe aplicando estas formas de pensar:\n\n" + mentorBlocks.join("\n\n") : "",
      brainToPrompt(brain),
      COPY_FOUNDATION,
      profileText,
      AI_BLOCK_SPEC,
    ].filter(Boolean).join("\n\n");

    const userText = [
      `Objetivo de esta landing: ${objective}`,
      audience ? `Público concreto: ${audience}` : "",
      notes ? `Notas adicionales: ${notes}` : "",
      "Genera la landing completa como JSON de bloques siguiendo la estructura recomendada. Solo el JSON.",
    ].filter(Boolean).join("\n");

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const stream = anthropic.messages.stream({
      model: "claude-opus-4-8",
      max_tokens: 16000,
      thinking: { type: "adaptive" },
      output_config: { effort: "medium" },
      system: [{ type: "text", text: system, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: userText }],
    });
    const msg = await stream.finalMessage();
    const text = msg.content.filter((b): b is Anthropic.TextBlock => b.type === "text").map((b) => b.text).join("");

    let blocks: LandingBlock[];
    try {
      blocks = sanitize(parseJson(text));
    } catch {
      return NextResponse.json({ error: "La IA no devolvió un formato válido. Inténtalo de nuevo." }, { status: 502 });
    }
    if (blocks.length === 0) return NextResponse.json({ error: "No se generó contenido. Reformula el objetivo." }, { status: 502 });

    return NextResponse.json({ blocks });
  } catch (e: unknown) {
    if (e instanceof Anthropic.AuthenticationError) return NextResponse.json({ error: "Clave de Anthropic inválida." }, { status: 502 });
    if (e instanceof Anthropic.RateLimitError) return NextResponse.json({ error: "Límite de uso alcanzado, prueba en un momento." }, { status: 429 });
    const m = e instanceof Error ? e.message : "Error desconocido";
    return NextResponse.json({ error: m }, { status: 500 });
  }
}
