// app/api/daily/save/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type EV = "E" | "V" | "Λ" | "Ǝ"
const EVS: EV[] = ["E", "V", "Λ", "Ǝ"]

type SaveRequest = {
  question_id: string                     // 例: daily-2025-09-09-A
  final_choice: EV
  first_choice?: EV | null
  changes?: number
  subset?: EV[]
  comment?: string | null
  quote?: string | null
  code?: EV
  // ▼ 追加：環境分離（dev/prod）
  env?: "dev" | "prod"
  // ▼ 後方互換：env未指定のときだけ使うフォールバック
  theme?: string | null                   // "dev" | "prod" 以外が来ても無視
}

/** βスコア：final=1.0、first≠final のとき first=0.25 */
function computeScoresBeta(finalChoice: EV, firstChoice?: EV | null) {
  const s: Record<EV, number> = { E: 0, V: 0, "Λ": 0, "Ǝ": 0 }
  s[finalChoice] = 1.0
  if (firstChoice && firstChoice !== finalChoice) s[firstChoice] = 0.25
  return s
}
const isEV = (v: unknown): v is EV => EVS.includes(v as EV)
const isEVArray = (v: unknown): v is EV[] => Array.isArray(v) && v.every(isEV)
const normEnv = (v: unknown): "dev" | "prod" => (String(v ?? "").toLowerCase() === "dev" ? "dev" : "prod")

export async function GET() {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })
 
  const {
    question_id,
    final_choice,
    first_choice = null,
    changes = 0,
    subset = null,
    comment = null,
    quote = null,
    code,
    env,         // ★ 新：優先して使う
    theme = null // ★ 旧：env未指定のときだけ見る
  } = body

  // 2) バリデーション
  if (!question_id || typeof question_id !== "string") {
    return NextResponse.json({ ok:false, error:"bad_request:question_id" }, { status:400 })
  }
  if (!isEV(final_choice)) {
    return NextResponse.json({ ok:false, error:"bad_request:final_choice" }, { status:400 })
  }
  if (first_choice != null && !isEV(first_choice)) {
    return NextResponse.json({ ok:false, error:"bad_request:first_choice" }, { status:400 })
  }
  if (subset != null && !isEVArray(subset)) {
    return NextResponse.json({ ok:false, error:"bad_request:subset" }, { status:400 })
  }

  // 3) 代表コード & 環境
  const repCode: EV = isEV(code) ? code : final_choice
  const resolvedEnv: "dev"|"prod" = env ? normEnv(env) : normEnv(theme)

  // 4) βスコア & 行動ログ
  const scores = computeScoresBeta(final_choice, first_choice)
  const raw_interactions = {
    first_choice,
    final_choice,
    changes: typeof changes === "number" ? changes : 0,
    subset: subset ?? null,
    env: resolvedEnv, // ★ ここに dev/prod を格納
  }

  // 5) 保存
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })

  const { data, error } = await sb
    .from("daily_results")
    .insert({
      question_id,
      code: repCode,
      comment,
      quote,
      scores,           // jsonb
      raw_interactions, // jsonb（env含む）
    })
    .select("*")
    .maybeSingle()

  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  return NextResponse.json({ ok:true, item:data })
}
