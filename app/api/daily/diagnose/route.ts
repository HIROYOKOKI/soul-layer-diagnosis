// app/api/daily/diagnose/route.ts
import { NextResponse } from "next/server"
import { getOpenAI } from "@/lib/openai"

type EV = "E" | "V" | "Λ" | "Ǝ"
type Slot = "morning" | "noon" | "night"

type Body = {
  id: string
  slot: Slot
  choice: EV
  env?: "dev" | "prod"
  theme?: "dev" | "prod"
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

// --- フォールバック文言（AI失敗時に必ず返す） ---
const FB_COMMENT: Record<EV, string> = {
  E: "今は内側の熱が静かに満ちる時期。小さな確定を一つ重ねれば、惰性はほどけていく。視線を近くに置き、今日できる最短の一歩を形にしよう。",
  V: "頭の中の未来像を、現実の手触りに寄せていく段階。理想は曖昧なままで良い。輪郭を一筆だけ濃くして、届く距離に引き寄せていこう。",
  Λ: "迷いは選ぶための素材。条件を一つに絞れば、余計な枝葉は落ちていく。比較を止めて基準を決める。その確定が次の余白を生む。",
  Ǝ: "静けさが判断を澄ませる。結論を急がず、観測を一拍置く。言葉にしない気配を拾えば、必要なものと不要なものが自然と分かれていく。",
}
const FB_ADVICE: Record<EV, string> = {
  E: "今日の行動は十分に小さく。五分で終わる作業を今ここで始める。終えたら深呼吸し、次の一手は明日に残す。",
  V: "理想の断片をノートに三行。明日やる一手を一文で決め、夜のうちに準備を一つだけ整える。",
  Λ: "判断の基準を一つ決める。「迷ったら◯◯」を書き出し、それに従う。比較は一度だけに。",
  Ǝ: "画面を閉じ、三分の無音をつくる。浮かんだ言葉を一語だけメモし、今夜はそこから先を求めない。",
}
const FB_QUOTE: Record<EV, string> = {
  E: "最小の一歩が流れを変える",
  V: "理想は近づけば輪郭になる",
  Λ: "決めると、余白が生まれる",
  Ǝ: "静けさが答えの形を示す",
}

/* ========= OpenAI生成 ========= */
async function genWithAI(code: EV, slot: Slot) {
  const oa = getOpenAI()
  const sys = `あなたはAIキャラクター「ルネア」。出力は必ずJSONのみ。
制約:
- comment: ${LEN.commentMin}〜${LEN.commentMax}字（丁寧語）
- advice : ${LEN.adviceMin}〜${LEN.adviceMax}字（具体的な一手）
- quote  : ${LEN.quoteMin}〜${LEN.quoteMax}字（短い一文のアファメーション）
- 口調: 静かで肯定的。断定しすぎない。絵文字/顔文字/英語は使わない。`
  const usr = `次の条件で「comment」「advice」「quote」を生成してJSONのみで返してください。
- 時間帯: ${slot}
- コード: ${code}（E=衝動, V=可能性, Λ=選択, Ǝ=観測。直接語を多用しない）
- テーマ: デイリー診断結果`

  const res = await oa.responses.create({
    model: "gpt-4.1-mini",
    temperature: 0.7,
    max_output_tokens: 400,
    input: [
      { role: "system", content: sys },
      { role: "user", content: usr },
    ],
  })
  const text = res.output_text || "{}"
  const json = JSON.parse(text.match(/\{[\s\S]*\}$/)?.[0] || "{}") as {
    comment?: string
    advice?: string
    quote?: string
  }

  // ポストプロセスで最終保証
  let comment = clampToRange(json.comment || "", LEN.commentMin, LEN.commentMax)
  let advice  = clampToRange(json.advice  || "", LEN.adviceMin , LEN.adviceMax )
  let quote   = clampToRange(json.quote   || "", LEN.quoteMin  , LEN.quoteMax  )

  // 一度だけリトライ（文字数外なら）
  const needRetry =
    !inRange(json.comment || "", LEN.commentMin, LEN.commentMax) ||
    !inRange(json.advice  || "", LEN.adviceMin , LEN.adviceMax ) ||
    !inRange(json.quote   || "", LEN.quoteMin  , LEN.quoteMax  )

  if (needRetry) {
    const retry = await oa.responses.create({
      model: "gpt-4.1-mini",
      temperature: 0.6,
      max_output_tokens: 400,
      input: [
        { role: "system", content: sys },
        { role: "user", content: `前回は文字数制約外でした。厳守して再出力。${usr}` },
      ],
    })
    const t2 = retry.output_text || "{}"
    const j2 = JSON.parse(t2.match(/\{[\s\S]*\}$/)?.[0] || "{}") as {
      comment?: string
      advice?: string
      quote?: string
    }
    comment = clampToRange(j2.comment || comment, LEN.commentMin, LEN.commentMax)
    advice  = clampToRange(j2.advice  || advice , LEN.adviceMin , LEN.adviceMax )
    quote   = clampToRange(j2.quote   || quote  , LEN.quoteMin  , LEN.quoteMax  )
  }

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

    // 生成 → 欠損時はフォールバック
    let comment: string | null = null
    let advice: string | null = null
    let quote: string | null = null

    try {
      const ai = await genWithAI(code, b.slot)
      comment = ai.comment?.trim() || null
      advice  = ai.advice?.trim()  || null
      quote   = ai.quote?.trim()   || null
    } catch {
      /* noop（フォールバックに任せる） */
    }

    if (!comment) comment = FB_COMMENT[code]
    if (!advice)  advice  = FB_ADVICE[code]
    if (!quote)   quote   = FB_QUOTE[code]

    // 最終的にもレンジに収める（安全弁）
    comment = clampToRange(comment, LEN.commentMin, LEN.commentMax)
    advice  = clampToRange(advice , LEN.adviceMin , LEN.adviceMax )
    quote   = clampToRange(quote  , LEN.quoteMin  , LEN.quoteMax  )

    const item = {
      id: b.id,
      slot: b.slot,
      code,
      comment,
      advice,
      quote,
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
