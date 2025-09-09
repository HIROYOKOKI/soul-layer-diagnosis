import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

export async function GET(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })

  const url = new URL(req.url)
  const env = (url.searchParams.get("env") || "prod").toLowerCase() // dev/prod

  const { data, error } = await sb
    .from("daily_results")
    .select("code, comment, quote, scores, raw_interactions, created_at, env, theme")
    .eq("env", env) // ★ 環境で絞る
    .order("created_at", { ascending:false })
    .limit(1).maybeSingle()

  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  return NextResponse.json({ ok:true, item: data ?? null })
}
