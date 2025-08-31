import { NextResponse } from "next/server"
import { getOpenAI } from "../../../../lib/openai"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

type Code = "E" | "V" | "Λ" | "Ǝ"
type Body = { code: Code; theme?: string; choice?: string }

const QUOTE: Record<Code, string[]> = {
  E: ['「Stay hungry, stay foolish.」— Steve Jobs', '「世界が君を試す日──君が世界を試す日。」— 岡本太郎'],
  V: ['「想像力は知識よりも重要だ。」— Einstein', '「夢見ることができれば、実現できる。」— Walt Disney'],
  "Λ": ['「吾輩は決めた後に自由だ。」— 夏目漱石(意訳)', '「為すべきことを為せ。」— 老子(意訳)'],
  "Ǝ": ['「我々は宇宙が自らを認識する手段だ。」— Carl Sagan', '「ただ観よ。ただ在れ。」— 道元(意訳)'],
}

export async function POST(req: Request) {
  const { code, theme = "daily", choice } = (await req.json()) as Body
  if (!code) return NextResponse.json({ ok:false, error:"missing_code" }, { status:400 })

  const ai = getOpenAI()
  const sys = "あなたは『ソウルレイヤー診断』のナビゲータ“ルネア”。柔らかく簡潔に。80文字前後。"
  const user = `構造コード=${code} の観測者へ、今日のヒントを一言で。比喩は軽めに。`

  let comment = "今日は静かに整えるほど、流れが見えます。"
  if (ai) {
    const r = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [{ role:"system", content: sys }, { role:"user", content: user }],
    })
    comment = r.choices[0]?.message?.content?.trim() || comment
  }
  const quoteList = QUOTE[code]
  const quote = quoteList[Math.floor(Math.random()*quoteList.length)]

  // 保存（環境が未設定ならスキップ）
  const sb = getSupabaseAdmin()
  if (sb) {
    await sb.from("daily_results").insert({ code, theme, choice: choice ?? null, comment, quote })
      .then(({ error }) => { if (error) console.error("save_failed:", error.message) })
  }

  return NextResponse.json({ ok:true, result:{ code, comment, quote } })
}
