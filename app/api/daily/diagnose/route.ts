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

// --- フォールバック文言（AI失敗時に必ず返す） ---
const FB_COMMENT: Record<EV, string> = {
  E: "意志を一点に。小さな確定が今日を動かす。",
  V: "理想の輪郭をもう一筆。届く距離まで寄せよう。",
  Λ: "迷いは選択の材料。条件を一つだけ決める。",
  Ǝ: "一拍おいて観測を。沈黙が次の手を澄ませる。",
}
const FB_QUOTE: Record<EV, string> = {
  E: "選んだ一歩が、次の地図になる。",
  V: "見える未来は、近づけば現実になる。",
  Λ: "決めるとは、捨てる勇気。",
  Ǝ: "静けさの中で、答えは輪郭を得る。",
}

async function genWithAI(code: EV, slot: Slot) {
  const oa = getOpenAI()
  const sys =
    "あなたはE/V/Λ/Ǝの4軸診断の短い結果テキストを作るライターです。常にJSONだけを返してください。"
  const usr = `以下の仕様でJSONを返してください:
{
  "comment": "<20〜40字の短文（丁寧語）>",
  "quote": "<12〜24字のアファメーション風の一文>"
}
制約:
- トーン: 静かで肯定的。断定的すぎない。
- 禁止: 絵文字・顔文字・英語
- テーマ: デイリー診断結果（時間帯: ${slot} / コード: ${code}）
- 用語: ${code} の性質を示唆（E=衝動, V=可能性, Λ=選択, Ǝ=観測）しつつ直接の単語多用は避ける
- 返答はJSONのみ`

  const res = await oa.responses.create({
    model: "gpt-4.1-mini",
    temperature: 0.5,
    max_output_tokens: 200,
    input: [
      { role: "system", content: sys },
      { role: "user", content: usr },
    ],
  })
  const text = res.output_text || ""
  const json = JSON.parse(text.match(/\{[\s\S]*\}$/)?.[0] || "{}")
  const comment =
    typeof json.comment === "string" && json.comment.trim()
      ? json.comment.trim()
      : null
  const quote =
    typeof json.quote === "string" && json.quote.trim()
      ? json.quote.trim()
      : null
  return { comment, quote }
}

export async function POST(req: Request) {
  try {
    const b = (await req.json()) as Body | null
    if (!b?.id || !b.slot || !b.choice) {
      return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 })
    }

    const env = b.env ?? "dev"     // ← デフォルト dev
    const theme = b.theme ?? "dev" // ← デフォルト dev
    const code = b.choice

    // まずAI生成を試す → 失敗/欠損ならフォールバック
    let comment: string | null = null
    let quote: string | null = null
    try {
      const ai = await genWithAI(code, b.slot)
      comment = ai.comment
      quote = ai.quote
    } catch {
      /* noop （フォールバックに任せる） */
    }
    if (!comment) comment = FB_COMMENT[code]
    if (!quote) quote = FB_QUOTE[code]

    // クライアントに返す item（ここでは保存はしない）
    const item = {
      id: b.id,
      slot: b.slot,
      code,
      comment,
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
