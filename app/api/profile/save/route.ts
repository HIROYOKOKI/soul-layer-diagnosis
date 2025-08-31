// app/api/profile/save/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

type Body =
  | { luneaLines: string[] }                                   // まとめ渡し
  | { fortune: string; personality: string; partner: string }  // 個別渡し

function extract(lines: string[]) {
  // 想定順：観測→運勢→性格→理想→締め（不足は空でフォールバック）
  const f = lines[1] ?? lines[0] ?? ""
  const p = lines[2] ?? ""
  const r = lines[3] ?? ""
  return { fortune: f, personality: p, partner: r }
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) {
    return NextResponse.json({ ok: false, error: "supabase_env_missing" }, { status: 500 })
  }

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }

  const payload =
    "luneaLines" in body
      ? extract(body.luneaLines)
      : { fortune: body.fortune ?? "", personality: body.personality ?? "", partner: body.partner ?? "" }

  // 必須チェック（最低限 fortune が空でなければ保存）
  if (!payload.fortune && !payload.personality && !payload.partner) {
    return NextResponse.json({ ok: false, error: "empty_payload" }, { status: 400 })
  }

  const { data, error } = await sb
    .from("profile_results")
    .insert([payload])
    .select("created_at")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, saved: true, created_at: data?.created_at ?? null }, {
    headers: { "Cache-Control": "no-store" },
  })
}
