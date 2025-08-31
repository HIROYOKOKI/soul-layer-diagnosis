// app/api/mypage/daily-latest/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

// 任意: 動的実行を明示（キャッシュ抑止の保険）
export const dynamic = "force-dynamic"

export async function GET(req: Request) {
  const sb = getSupabaseAdmin()
  const headers = { "Cache-Control": "no-store" as const }

  if (!sb) {
    return NextResponse.json(
      { ok: false, error: "supabase_env_missing" },
      { status: 500, headers }
    )
  }

  try {
    const url = new URL(req.url)
    const theme = url.searchParams.get("theme") // 例: ?theme=dev で dev のみ表示

    let q = sb
      .from("daily_results")
      .select("code, comment, quote, created_at")
      .order("created_at", { ascending: false })

    if (theme) q = q.eq("theme", theme)

    const { data, error } = await q.limit(1).maybeSingle()

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers }
      )
    }

    return NextResponse.json({ ok: true, item: data ?? null }, { headers })
  } catch (e) {
    const message = e instanceof Error ? e.message : "unexpected_error"
    return NextResponse.json({ ok: false, error: message }, { status: 500, headers })
  }
}
