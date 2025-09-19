// app/api/daily/save/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

type Slot = "morning" | "noon" | "night"
type Env = "dev" | "prod"
type Theme = "dev" | "prod"
type EV = "E" | "V" | "Λ" | "Ǝ"
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE"

export async function POST(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) {
    return NextResponse.json({ ok: false, error: "supabase_env_missing" }, { status: 500 })
  }

  try {
    const body = (await req.json()) as {
      id?: string                  // e.g. daily-2025-09-20-morning-LOVE
      slot?: Slot
      env?: Env
      theme?: Theme
      choice?: EV
      scope?: Scope                // ★ 追加: デイリーテーマ
      result?: { code?: EV; comment?: string; advice?: string; quote?: string }
      user_id?: string | null
    }

    const {
      id,
      slot,
      env = "dev",
      theme = "dev",
      choice,
      scope,
      result,
      user_id,
    } = body || {}

    if (!id || !result?.code) {
      return NextResponse.json(
        { ok: false, error: "bad_request_missing_fields" },
        { status: 400 }
      )
    }

    // 保存用レコード
    const payload: Record<string, any> = {
      question_id: id,
      env,
      theme,
      choice: choice ?? result.code,
      code: result.code,
      comment: result.comment ?? null,
      advice: result.advice ?? null,
      quote: result.quote ?? null,
    }

    if (slot) payload.mode = slot
    if (scope) payload.scope = scope         // ★ scope を保存
    if (user_id) payload.user_id = user_id

    const { data, error } = await sb
      .from("daily_results")
      .upsert(payload, { onConflict: "question_id" })
      .select("id, question_id, scope")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      id: data?.id,
      question_id: data?.question_id ?? id,
      scope: data?.scope ?? scope,         // 応答にも scope を含める
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal_error" },
      { status: 500 },
    )
  }
}
