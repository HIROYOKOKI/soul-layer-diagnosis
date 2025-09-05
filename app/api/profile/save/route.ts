// app/api/profile/save/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

// 受け取り想定の型
type Body = {
  user_id?: string | null
  // プロフィール診断の要約（既存）
  fortune?: string | null
  personality?: string | null
  partner?: string | null
  // クイック基礎層（今回追加）
  base_model?: "EΛVƎ" | "EVΛƎ" | null
  base_order?: ("E" | "V" | "Λ" | "Ǝ")[] | null
  base_points?: Record<"E" | "V" | "Λ" | "Ǝ", number> | null
}

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin()
    if (!sb) {
      return NextResponse.json({ ok: false, error: "supabase_env_missing" }, { status: 500 })
    }

    const body = (await req.json()) as Body

    // 軽いバリデーション（必要最小限）
    if (!body) {
      return NextResponse.json({ ok: false, error: "empty_body" }, { status: 400 })
    }
    if (body.base_order && body.base_order.length !== 4) {
      return NextResponse.json({ ok: false, error: "invalid_base_order" }, { status: 400 })
    }

    // INSERT 用レコード整形（未指定はnullで保存）
    const row = {
      user_id: body.user_id ?? null,
      fortune: body.fortune ?? null,
      personality: body.personality ?? null,
      partner: body.partner ?? null,
      base_model: body.base_model ?? null,
      base_order: body.base_order ?? null,     // text[] へ
      base_points: body.base_points ?? null,   // jsonb へ
    }

    const { data, error } = await sb
      .from("profile_results")
      .insert([row])
      .select("id, created_at, base_model")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data?.id, created_at: data?.created_at, base_model: data?.base_model })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e?.message ?? e) }, { status: 500 })
  }
}
