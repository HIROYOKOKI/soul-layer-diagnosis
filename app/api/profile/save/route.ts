// app/api/profile/save/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

type MaybeTextObj = string | { text?: string } | null | undefined
type MaybeLine = string | { type?: string; label?: string; text?: string }

function toText(v: MaybeTextObj): string {
  if (v == null) return ""
  if (typeof v === "string") {
    try {
      const j = JSON.parse(v)
      if (j && typeof j === "object" && "text" in j) return String((j as any).text ?? "")
      return v
    } catch { return v }
  }
  return String(v.text ?? "")
}

function extractFromLines(lines: unknown) {
  const arr = Array.isArray(lines) ? (lines as MaybeLine[]).map(x => toText(x as any)) : []
  const fortune     = arr[1] ?? arr[0] ?? ""
  const personality = arr[2] ?? ""
  const partner     = arr[3] ?? ""
  return { fortune, personality, partner }
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })

  let body: any
  try { body = await req.json() } catch { return NextResponse.json({ ok:false, error:"invalid_json" }, { status:400 }) }

  const payload = Array.isArray(body?.luneaLines)
    ? extractFromLines(body.luneaLines)
    : {
        fortune:     toText(body?.fortune),
        personality: toText(body?.personality),
        partner:     toText(body?.partner),
      }

  if (!payload.fortune && !payload.personality && !payload.partner) {
    return NextResponse.json({ ok:false, error:"empty_payload" }, { status:400 })
  }

  const { data, error } = await sb
    .from("profile_results")
    .insert([payload])
    .select("created_at")
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })

  return NextResponse.json({ ok:true, saved:true, created_at: data?.[0]?.created_at ?? null }, {
    headers: { "Cache-Control": "no-store" }
  })
}
