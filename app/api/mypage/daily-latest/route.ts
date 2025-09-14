import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

export async function GET(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })

  const url = new URL(req.url)
  const env = url.searchParams.get("env") // "dev" | "prod" | null

  let q = sb
    .from("daily_results")
    .select("code, comment, quote, env, theme, created_at, updated_at")
    .order("created_at", { ascending:false })

  if (env) q = q.eq("env", env)

  const { data, error } = await q.limit(1).maybeSingle()
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  return NextResponse.json({ ok:true, item: data ?? null })
}
