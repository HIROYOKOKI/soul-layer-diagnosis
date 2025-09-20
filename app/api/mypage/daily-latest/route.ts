// app/api/mypage/daily-latest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Env = "dev" | "prod";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

export async function GET(req: NextRequest) {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 });

  const env = ((req.nextUrl.searchParams.get("env") ?? "dev").toLowerCase() as Env) || "dev";
  const scope = req.nextUrl.searchParams.get("scope")?.toUpperCase() as Scope | undefined;

  let q = sb.from("daily_results")
    .select("code, comment, advice, quote, scope, mode, env, created_at, question_id")
    .eq("env", env)
    .order("created_at", { ascending:false })
    .limit(1);

  if (scope) q = q.eq("scope", scope);   // ★ ここでテーマ絞り込み

  const { data, error } = await q.maybeSingle();
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 });

  // 指定scopeに該当が無かった場合は、全体の最新をフォールバックで返す
  if (!data && scope) {
    const { data: anyLatest } = await sb
      .from("daily_results")
      .select("code, comment, advice, quote, scope, mode, env, created_at, question_id")
      .eq("env", env)
      .order("created_at", { ascending:false })
      .limit(1)
      .maybeSingle();
    return NextResponse.json({ ok:true, item: anyLatest ?? null });
  }

  return NextResponse.json({ ok:true, item: data ?? null });
}
