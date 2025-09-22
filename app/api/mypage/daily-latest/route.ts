import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok: false, error: "supabase_env_missing" }, { status: 500 });

  // 認証導入前は「最新1件」を単純取得（本番では user_id で絞る）
  const { data, error } = await sb
    .from("daily_results")
    .select("slot, theme, score, comment, advice, affirm, quote, code, evla, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, item: data ?? null });
}
