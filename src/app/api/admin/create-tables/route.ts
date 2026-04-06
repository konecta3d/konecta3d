import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Create table using RPC or direct SQL through admin
    // First check if table exists
    const { data: tableExists } = await supabaseAdmin.rpc('pg_table_is_visible', { 
      table_oid: 'settings'::regclass::oid 
    }).catch(() => ({ data: null }));

    // Try to create table using raw SQL through admin client
    const { error } = await supabaseAdmin.from("settings").select("*").limit(1);

    if (error && error.message.includes("does not exist")) {
      // Table doesn't exist - we need to create it
      // This is a workaround - in production, run the SQL manually in Supabase dashboard
      return NextResponse.json({ 
        error: "La tabla no existe. Por favor, ejecuta el SQL en Supabase Dashboard.",
        sql: `CREATE TABLE IF NOT EXISTS settings (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          key TEXT UNIQUE NOT NULL,
          value JSONB DEFAULT '{}',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );`
      }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
