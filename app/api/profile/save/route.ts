// app/api/profile/save/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

type SaveBody = {
  fortune?: string
  personality?: string
  work?: string
  partner?: string
}

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin()
    if (!sb) {
      return NextResponse.json({ ok: false, error: "supabase_env_missing" }, { status: 500 })
    }

    const body = (await req.json()) as SaveBody
    const { fortune, personality, work, partner } = body || {}

    // 最低限のバリデーション（空文字はnull化）
    const row = {
      fortune: (fortune || "").trim() || null,
      personality: (personality || "").trim() || null,
      work: (work || "").trim() || null,
      partner: (partner || "").trim() || null,
      // created_at は Supabase 側の default now() を利用
    }

    // 4つ全部が空ならエラー
    if (!row.fortune && !row.personality && !row.work && !row.partner) {
      return NextResponse.json({ ok: false, error: "empty_detail" }, { status: 400 })
    }

    const { data, error } = await sb.from("profile_results").insert(row).select("*").maybeSingle()
    if (error) {
      return NextResponse.json({ ok: false, error: "supabase_insert_failed", detail: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, item: data })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 })
  }
}
