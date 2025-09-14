// app/api/daily/save/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

type Slot = "morning" | "noon" | "night"
type Env = "dev" | "prod"
type Theme = "dev" | "prod"

export async function POST(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) {
    return NextResponse.json({ ok: false, error: "supabase_env_missing" }, { status: 500 })
  }

  try {
    const body = await req.json() as {
      id?: string               // 論理ID（例: daily-2025-09-14-morning）→ question_id に保存
      slot?: Slot               // スキーマに slot 列がないため mode 列にマッピング
      env?: Env                 // enum(env_key)。'dev' を事前に追加済みであること
      theme?: Theme             // enum(theme_key)
      choice?: "E" | "V" | "Λ" | "Ǝ"
      result?: { code?: "E" | "V" | "Λ" | "Ǝ"; comment?: string; quote?: string }
      user_id?: string          // 将来使う場合のみ。null許容のままでOK
    }

    const {
      id,                       // ← 必須（question_id に入れる）
      slot,
      env = "dev",
      theme = "dev",
      choice,
      result,
      user_id,
    } = body || {}

    // 必須チェック
    if (!id || !result?.code) {
      return NextResponse.json(
        { ok: false, error: "bad_request_missing_fields" },
        { status: 400 },
      )
    }

    // 保存ペイロード（created_at/updated_at はDB側 default/triggerに任せる）
    const payload: Record<string, any> = {
      question_id: id,
      env,
      theme,
      choice: choice ?? result.code,
      code: result.code,
      comment: result.comment ?? null,
      quote: result.quote ?? null,
    }

    // スキーマに slot 列は無い → mode に保存（不要ならこの1行を削除）
    if (slot) payload.mode = slot

    // ユーザー別に運用するなら user_id を付与（現状は任意）
    if (user_id) payload.user_id = user_id

    // 上書き保存：question_id をユニークキーにして upsert
    // ※ 事前に SQL で UNIQUE(question_id) を付与推奨
    const { data, error } = await sb
      .from("daily_results")
      .upsert(payload, { onConflict: "question_id" })
      .select("id, question_id")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      ok: true,
      id: data?.id,                 // DBの連番（int8）
      question_id: data?.question_id ?? id, // 論理ID
    })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal_error" },
      { status: 500 },
    )
  }
}
