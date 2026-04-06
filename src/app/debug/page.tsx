"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export default function DebugPage() {
  const [info, setInfo] = useState<any>(null);

  useEffect(() => {
    const check = async () => {
      // Get current session
      const { data: session } = await supabase.auth.getSession();
      setInfo({ session: session.session ? { user_id: session.session.user.id, email: session.session.user.email } : null });
    };
    check();
  }, []);

  if (!info) return <div>Cargando...</div>;

  return (
    <div style={{ padding: 20, fontFamily: 'monospace' }}>
      <h1>Debug Session</h1>
      <pre>{JSON.stringify(info, null, 2)}</pre>
    </div>
  );
}
