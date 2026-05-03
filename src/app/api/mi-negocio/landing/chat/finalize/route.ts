import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { verifyBusinessOwnership } from "@/lib/auth-helpers";
import type { LandingConfig } from "@/lib/landingTypes";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  changes: Partial<LandingConfig> | null;
  timestamp: string;
}

interface FinalizeRequest {
  businessId: string;
  messages: ChatMessage[];
  finalConfig: LandingConfig;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FinalizeRequest;
    const { businessId, messages, finalConfig } = body;

    if (!businessId || !messages || !finalConfig) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const hasOwnership = await verifyBusinessOwnership(req, businessId);
    if (!hasOwnership) {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { error } = await supabaseAdmin.from("landing_ai_conversations").insert({
      business_id: businessId,
      messages,
      final_config: finalConfig,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      console.error("finalize insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("finalize route error:", e);
    return NextResponse.json({ error: "server_error" }, { status: 500 });
  }
}
