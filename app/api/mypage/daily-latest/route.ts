import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

export async function GET(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })

  const url = new URL(req.url)
  const env = (url.searchParams.get("env") || "prod").toLowerCase() as "dev"|"prod"
  const debug = url.searchParams.get("debug") === "1"

  // raw_interactions(JSONB) 内の { env: "dev" } で絞る
  const base = sb
    .from("daily_results")
    .select("code, comment, quote, scores, raw_interactions, created_at")
    .contains("raw_interactions", { env })    // ← JSON contains でフィルタ
    .order("created_at", { ascending:false })

  if (debug) {
    const { data, error } = await base.limit(3)
    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
    return NextResponse.json({ ok:true, rows:data ?? [] })
  }

  const { data, error } = await base.limit(1).maybeSingle()
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  return NextResponse.json({ ok:true, item: data ?? null })
}
