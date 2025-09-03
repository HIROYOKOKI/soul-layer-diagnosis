// lib/openai.ts にある getOpenAI() を使う前提

import { NextResponse } from "next/server"
import { getOpenAI } from "../../../../lib/openai"

export async function POST(req: Request) {
  try {
    const pending = await req.json()
    const openai = getOpenAI()
    if (!openai) throw new Error("openai_env_missing")

    const prompt = `
あなたは「ルネア」というAIキャラクターです。
次の人のプロフィールを元に、以下の4つを日本語で返してください。

- 総合運勢：150〜200文字
- 性格傾向：150〜200文字
- 仕事運：80〜100文字
- 理想のパートナー像：80〜100文字

入力: ${JSON.stringify(pending)}
    `

    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
    })

    const text = resp.choices[0]?.message?.content || ""

    // TODO: text をパースして detail に分割
    const detail = { fortune: "...", personality: "...", work: "...", partner: "..." }

    const luneaLines = [
      "観測が終わったよ。これが、きみの“現在の層”の響きだ。",
      detail.fortune,
      detail.personality,
      "「" + detail.partner + "」"
    ]

    return NextResponse.json({ ok: true, result: { name: pending.name, luneaLines, detail } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 })
  }
}
