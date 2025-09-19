// app/api/daily/diagnose/route.ts
import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"

type EV = "E" | "V" | "Λ" | "Ǝ"
type Slot = "morning" | "noon" | "night"
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE"

const SCOPE_HINT: Record<Scope, string> = {
  WORK:   "仕事・学び・成果・チーム連携・自己効率",
  LOVE:   "恋愛・対人関係・信頼・距離感・感情のやり取り",
  FUTURE: "将来・目標・計画・成長・可能性の可視化",
  LIFE:   "生活全般・習慣・健康・心身の整え・日々の選択",
}

type Body = {
  id: string
  slot: Slot
  choice: EV
  scope?: Scope              // ★ 追加: デイリーのテーマ
  env?: "dev" | "prod"
  theme?: "dev" | "prod"     // 既存の環境区分はそのまま
  ts?: string
}

/* ========= 文字数ユーティリティ ========= */
const jpLen = (s: string) => Array.from(s ?? "").length
const clampToRange = (text: string, min: number, max: number) => {
  const t = (text || "").trim().replace(/\s+/g, " ")
  if (!t) return t
  if (jpLen(t) <= max) {
    return /[。.!?！？]$/.test(t) ? t : t + "。"
  }
  const arr = Array.from(t).slice(0, max)
  const j = arr.join("")
  const m =
    j.match(/^(.*?)([。.!?！？]|、|,|;|：|:)\s*[^。.!?！？、,;：:]*$/) ||
    j.match(/^(.*?)[\s　][^ \t　]*$/)
  const cut = (m?.[1] || j).replace(/\s+$/, "")
  return (/[。.!?！？]$/.test(cut) ? cut : cut + "。")
}
const inRange = (s: string, min: number, max: number) => {
  const n = jpLen((s || "").trim())
  return n >= min && n <= max
}

/* ========= 仕様（記憶済み） ========= */
const LEN = {
  commentMin: 100,
  commentMax: 150,
  adviceMin: 100,
  adviceMax: 150,
  quoteMin: 15,
  quoteMax: 30,
} as const

/* ========= アファメーション検査/補正 ========= */
const isAffirmation = (s: string) => {
  const t = (s || "").trim()
  if (!/^(私は|わたしは)/.test(t)) return false
  if (/[「」『』《》"“”]/.test(t)) return false
  return true
}
const toAffirmationFallback = (code: EV): string => {
  switch (code) {
    case "E": return "私は情熱を信じ一歩踏み出す"
    case "V": return "私は理想を描き形にしている"
    case "Λ": return "私は基準を定め迷いを越える"
    case "Ǝ": return "私は静けさで本質を見つめる"
  }
}
const normalizeAffirmation = (code: EV, s: string): string => {
  let t = (s || "").trim().replace(/[「」『』《》"“”]/g, "").trim()
  if (!/^(私は|わたしは)/.test(t)) t = toAffirmationFallback(code)
  return clampToRange(t, LEN.quoteMin, LEN.quoteMax)
}

/* ========= フォールバック文言 ========= */
const FB_COMMENT: Record<EV, string> = {
  E: `今は内側の熱が静かに満ちる時期。小さな確定を一つ重ねれば、惰性はほどけていく。視線を近くに置き、今日できる最短の一歩を形にしよう。`,
  V: `頭の中の未来像を、現実の手触りに寄せていく段階。理想は曖昧なままで良い。輪郭を一筆だけ濃くして、届く距離に引き寄せていこう。`,
  Λ: `迷いは選ぶための素材。条件を一つに絞れば、余計な枝葉は落ちていく。比較を止めて基準を決める。その確定が次の余白を生む。`,
  Ǝ: `静けさが判断を澄ませる。結論を急がず、観測を一拍置く。言葉にしない気配を拾えば、必要なものと不要なものが自然と分かれていく。`,
}
const FB_ADVICE: Record<EV, string> = {
  E: `今日の行動は十分に小さく。五分で終わる作業を今ここで始める。終えたら深呼吸し、次の一手は明日に残す。`,
  V: `理想の断片をノートに三行。明日やる一手を一文で決め、夜のうちに準備を一つだけ整える。`,
  Λ: `判断の基準を一つ決める。「迷ったら◯◯」を書き出し、それに従う。比較は一度だけに。`,
  Ǝ: `画面を閉じ、三分の無音をつくる。浮かんだ言葉を一語だけメモし、今夜はそこから先を求めない。`,
}
const FB_QUOTE: Record<EV, string> = {
  E: `私は最小の一歩で流れを変える`,
  V: `私は理想の輪郭を近づけている`,
  Λ: `私は基準を決めて前に進む`,
  Ǝ: `私は静けさの中で答えを見る`,
}

/* ========= OpenAI生成 ========= */
async function genWithAI(code: EV, slot: Slot, scope: Scope) {
  const oa = getOpenAI()
  const sys = `あなたはAIキャラクター「ルネア」。出力は必ずJSONのみ。
必須キー:
- comment: ${LEN.commentMin}〜${LEN.commentMax}字（丁寧語）
- advice : ${LEN.adviceMin}〜${LEN.adviceMax}字（具体的な一手）
- quote  : ${LEN.quoteMin}〜${LEN.quoteMax}字（自己肯定のアファメーション）
厳守:
- quote は必ず「私は…」または「わたしは…」で始める一人称・現在形
- quote は引用文・格言・第三者表現・《》や「」等の括りを使わない
- 日本語のみ。JSON以外の文字は出力しない
- comment/advice は選択コード（E=衝動, V=可能性, Λ=選択, Ǝ=観測）と テーマ(scope) の文脈に沿う（直接語を多用しすぎない）`

  const usr = `次の条件で「comment」「advice」「quote」をJSONのみで返してください。
- 時間帯: ${slot}
- テーマ(scope): ${scope}（文脈: ${SCOPE_HINT[scope]})
- 選択コード: ${code}
- テーマの状況に寄り添い、日常で使える実践的な言葉にすること`

  const res = await oa.responses.create({
    model: "gpt-5-mini",
    temperature: 0.7,
    max_output_tokens: 400,
    input: [
      { role: "system", content: sys },
      { role: "user", content: usr },
    ],
  })

  const text = (res as any).output_text || "{}"
  const json = JSON.parse(text.match(/\{[\s\S]*\}$/)?.[0] || "{}") as {
    comment?: string
    advice?: string
    quote?: string
  }

  let comment = clampToRange(json.comment || "", LEN.commentMin, LEN.commentMax)
  let advice  = clampToRange(json.advice  || "", LEN.adviceMin , LEN.adviceMax )
  let quote   = clampToRange(json.quote   || "", LEN.quoteMin  , LEN.quoteMax  )

  const needRetry =
    !inRange(json.comment || "", LEN.commentMin, LEN.commentMax) ||
    !inRange(json.advice  || "", LEN.adviceMin , LEN.adviceMax ) ||
    !isAffirmation(json.quote || "") ||
    !inRange(json.quote || "", LEN.quoteMin, LEN.quoteMax)

  if (needRetry) {
    const retry = await oa.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.6,
      max_output_tokens: 400,
      input: [
        { role: "system", content: sys },
        { role: "user", content: `前回は制約外でした。厳守して再出力。${usr}` },
      ],
    })
    const t2 = (retry as any).output_text || "{}"
    const j2 = JSON.parse(t2.match(/\{[\s\S]*\}$/)?.[0] || "{}") as {
      comment?: string
      advice?: string
      quote?: string
    }
    comment = clampToRange(j2.comment || comment, LEN.commentMin, LEN.commentMax)
    advice  = clampToRange(j2.advice  || advice , LEN.adviceMin , LEN.adviceMax )
    quote   = clampToRange(j2.quote  || quote  , LEN.quoteMin  , LEN.quoteMax  )
  }

  quote = normalizeAffirmation(code, quote)
  return { comment, advice, quote }
}

/* ========= ハンドラ ========= */
export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body | null
    if (!b?.id || !b.slot || !b.choice) {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 })
    }

    const env = b.env ?? "dev"
    const theme = b.theme ?? "dev"
    const code = b.choice
    const scope: Scope = (b.scope?.toUpperCase() as Scope) || "LIFE"

    let comment: string | null = null
    let advice: string | null = null
    let quote: string | null = null

    try {
      const ai = await genWithAI(code, b.slot, scope)
      comment = ai.comment?.trim() || null
      advice  = ai.advice?.trim()  || null
      quote   = ai.quote?.trim()   || null
    } catch {
      /* noop */
    }

    if (!comment) comment = FB_COMMENT[code]
    if (!advice)  advice  = FB_ADVICE[code]
    if (!quote)   quote   = FB_QUOTE[code]

    comment = clampToRange(comment, LEN.commentMin, LEN.commentMax)
    advice  = clampToRange(advice , LEN.adviceMin , LEN.adviceMax )
    quote   = normalizeAffirmation(code, quote)

    const item = {
      id: b.id,
      slot: b.slot,
      scope,          // ★ 追加（保存にも残すと良い）
      code,
      comment,
      advice,
      quote,          // 《アファメーション》
      env,
      theme,
      created_at: new Date().toISOString(),
    }

    return NextResponse.json({ ok: true, item })
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal_error" },
      { status: 500 },
    )
  }
}
