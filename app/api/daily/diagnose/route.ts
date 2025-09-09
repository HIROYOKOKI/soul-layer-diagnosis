import { NextResponse } from "next/server"
import { getOpenAI } from "../../../../lib/openai"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type EV = "E" | "V" | "Λ" | "Ǝ"

function normalizeCode(x?: string | null): EV {
  const s = String(x ?? "").trim()
  if (s === "A") return "Λ"
  if (s === "∃" || s === "ヨ") return "Ǝ"
  return (["E","V","Λ","Ǝ"].includes(s) ? (s as EV) : "E")
}

function fallbackComment(code: EV) {
  if (code === "E") return "勢いが生む熱が、周囲を動かす合図。小さく速く着手して、火が広がる方向を観測しよう。"
  if (code === "V") return "まだ形にならない可能性に光を当てるタイミング。仮説を3つ出し、最短で試せる案を選ぼう。"
  if (code === "Λ") return "迷いは選択の兆し。基準を1行で決めて、可否を即断。次の一歩で流れが変わる。"
  return "静けさは精度を上げる資源。いまは広げず、ひとつを小さく検証して事実を積み上げよう。"
}

function fallbackAffirmation(code: EV) {
  if (code === "E") return "私は最初の一歩を選ぶ"
  if (code === "V") return "私は可能性を見つける"
  if (code === "Λ") return "私は基準を決めて進む"
  return "私は小さく観測して整える"
}

function tidyAffirmation(s: string) {
  return (s || "")
    .replace(/[“”"『』「」]/g, "")
    .trim()
    .slice(0, 30) // 長すぎ防止（短い一言のまま）
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null) as { choice?: string; env?: string; theme?: string } | null
  if (!body) return NextResponse.json({ ok:false, error:"invalid_json" }, { status:400 })

  const code = normalizeCode(body.choice)
  const env = String(body.env ?? body.theme ?? "prod").toLowerCase() === "dev" ? "dev" : "prod"

  let aiComment = ""
  let aiAff = ""
  try {
    const openai = getOpenAI()
    const sys =
`あなたはEVΛƎ診断のAI「ルネア」。口調は落ち着いた優しさ、断定は避けつつ背中を押す。
コード: E=衝動/情熱, V=可能性/夢, Λ=選択/設計, Ǝ=観測/静寂。
出力はJSONのみ。`
    const usr =
`対象コード="${code}"。
要件:
- comment: 90〜140字/日本語。今日の行動が1つ選べるように短く具体化。
- affirmation: 10〜20字/日本語。現在形の一人称（「私は…」/「今日の私は…」など）。句読点や引用符は不要。
出力:
{"comment":"...","affirmation":"..."}`

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.6,
      messages: [{ role:"system", content: sys }, { role:"user", content: usr }],
    })
    const text = resp.choices?.[0]?.message?.content?.trim() ?? ""
    const json = JSON.parse(text)
    aiComment = (json?.comment || "").toString().trim()
    aiAff     = tidyAffirmation((json?.affirmation || "").toString())
  } catch {}

  const comment = aiComment || fallbackComment(code)
  const affirmation = aiAff || fallbackAffirmation(code)

  // 互換のため quote にも同じ内容を入れて返す（保存APIはquoteを受け取っているため）
  return NextResponse.json({ ok:true, code, comment, affirmation, quote: affirmation, env })
}
