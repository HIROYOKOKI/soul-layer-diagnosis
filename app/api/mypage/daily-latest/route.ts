// app/api/mypage/daily-latest/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

export async function GET(req: Request) {
  const sb = getSupabaseAdmin()
  const url = new URL(req.url)
  const env = url.searchParams.get("env")

  let q = sb
    .from("daily_results")
    .select("code, comment, quote, theme, env, created_at, updated_at")
    .order("updated_at", { ascending:false })
    .limit(1)
    .maybeSingle()

  if (env) q = q.eq("env", env)     // ← envがあればフィルター

  const { data, error } = await q
  return NextResponse.json({ ok: !error, item: data ?? null }, { status: error ? 500 : 200 })
}
