// app/api/mypage/daily-latest/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

export async function GET(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })

  const url = new URL(req.url)
  const env = url.searchParams.get("env")

  let q = sb
    .from("daily_results")
    .select("code, comment, quote, theme, env, created_at, updated_at")
    .order("updated_at", { ascending:false })  // 上書き更新も拾える
    .limit(1)
    .maybeSingle()

  if (env) q = q.eq("env", env)

  const { data, error } = await q
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  return NextResponse.json({ ok:true, item: data ?? null })
}
