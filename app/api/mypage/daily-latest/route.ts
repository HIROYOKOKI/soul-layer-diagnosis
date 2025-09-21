import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json(
      { ok: false, error: "supabase_env_missing" },
      { status: 500 }
    );
  }

  // 期待スキーマ（例）: daily_results(code text, comment text, created_at timestamptz, ...）
  const { data, error } = await sb
    .from("daily_results")
    .select("code, comment, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }
  // データが無い場合も { ok:true, item:null } を返す（フロントで「未取得」表示）
  return NextResponse.json({ ok: true, item: data ?? null });
}
