// app/api/daily/save/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

// ── ランタイム設定（Vercel/Next） ─────────────────
export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// ── 型 ────────────────────────────────────────────
type EV = "E" | "V" | "Λ" | "Ǝ"
const EVS: EV[] = ["E", "V", "Λ", "Ǝ"]

type SaveRequest = {
  /** 例: "daily-2025-09-09-A"（JST日付 + A/B/C） */
  question_id: string
  /** 最終選択コード（必須） */
  final_choice: EV
  /** 初回選択コード（任意） */
  first_choice?: EV | null
  /** 選び直し回数（任意・デフォルト0） */
  changes?: number
  /** 出題時の subset（2/3/4択のコード配列, 任意） */
  subset?: EV[]
  /** 表示コメント（任意） */
  comment?: string | null
  /** 名言・引用（任意） */
  quote?: string | null
  /** 保存上の代表コード（省略時 final_choice を採用） */
  code?: EV
  /** dev / prod の流し分け */
  theme?: "dev" | "prod"
}

/** βスコア計算：final=1.0、first≠final の場合のみ first=0.25 を加点 */
function computeScoresBeta(finalChoice: EV, firstChoice?: EV | null) {
  const s: Record<EV, number> = { E: 0, V: 0, "Λ": 0, "Ǝ": 0 }
  s[finalChoice] = 1.0
  if (firstChoice && firstChoice !== finalChoice) s[firstChoice] = 0.25
  return s
}

function isEV(v: unknown): v is EV {
  return EVS.includes(v as EV)
}
function isEVArray(v: unknown): v is EV[] {
  return Array.isArray(v) && v.every(isEV)
}

// ── ハンドラ ─────────────────────────────────────
export async function POST(req: Request) {
  // 1) JSON 受け取り
  const bodyUnknown = await req.json().catch(() => null)
  if (!bodyUnknown) {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 })
  }
  const {
    question_id,
    final_choice,
    first_choice = null,
    changes = 0,
    subset = null,
    comment = null,
    quote = null,
    code,
    theme = "prod",
  } = bodyUnknown as Partial<SaveRequest>

  // 2) バリデーション
  if (!question_id || typeof question_id !== "string") {
    return NextResponse.json({ ok: false, error: "bad_request:question_id" }, { status: 400 })
  }
  if (!isEV(final_choice)) {
    return NextResponse.json({ ok: false, error: "bad_request:final_choice" }, { status: 400 })
  }
  if (first_choice != null && !isEV(first_choice)) {
    return NextResponse.json({ ok: false, error: "bad_request:first_choice" }, { status: 400 })
  }
  if (subset != null && !isEVArray(subset)) {
    return NextResponse.json({ ok: false, error: "bad_request:subset" }, { status: 400 })
  }
  const repCode: EV = isEV(code) ? code : final_choice

  // 3) βスコア計算 & 生ログ
  const scores = computeScoresBeta(final_choice, first_choice)
  const raw_interactions = {
    first_choice,
    final_choice,
    changes: typeof changes === "number" ? changes : 0,
    subset: subset ?? null,
  }

  // 4) Supabase（service role; top-level new禁止 → ラッパー使用）
  const sb = getSupabaseAdmin()
  if (!sb) {
    return NextResponse.json({ ok: false, error: "supabase_env_missing" }, { status: 500 })
  }

  // 5) 保存
  const { data, error } = await sb
    .from("daily_results")
    .insert({
      question_id,
      code: repCode,
      comment,
      quote,
      theme,
      scores,            // ← jsonb
      raw_interactions,  // ← jsonb
    })
    .select("*")
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, item: data }, { status: 200 })
}
