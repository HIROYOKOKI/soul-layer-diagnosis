import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/app/_utils/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const supabase = await createSupabaseServerClient();

    // 👇 ここに入れる（server.ts ではない）
    console.log("SUPABASE TYPE", typeof supabase);
    console.log("HAS AUTH?", !!(supabase as any)?.auth);
    console.log("HAS getUser?", !!(supabase as any)?.auth?.getUser);

    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return NextResponse.json(
        { ok: false, error: "not_authenticated", detail: error?.message ?? null },
        { status: 401 }
      );
    }

    return NextResponse.json({ ok: true, user: data.user });
  } catch (e: any) {
    console.error("API /me ERROR:", e);
    return NextResponse.json(
      { ok: false, error: "internal_error", detail: e?.message ?? String(e) },
      { status: 500 }
    );
  }
}
