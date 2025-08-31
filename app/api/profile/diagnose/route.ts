// app/api/profile/diagnose/route.ts
import { NextResponse } from "next/server"
import { getOpenAI } from "../../../../lib/openai"

type Body = {
  name: string
  birthday: string
  blood: "A" | "B" | "O" | "AB"
  gender: "Male" | "Female" | "Other"
  preference?: string | null
}

function buildPrompt(b: Body) {
  return `以下の人物に向けて、LUNEAの口調で5行の短いガイダンスを出してください。
- 名前:${b.name} / 誕生日:${b.birthday} / 血液型:${b.blood} / 性別:${b.gender}
出力は各行を1文、プレーンテキストで。`
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const oa = getOpenAI()
    const resp = await oa.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      messages: [
        { role: "system", content: "あなたは優しいナビゲータLUNEA。日本語で簡潔に話す。" },
        { role: "user", content: buildPrompt(body) },
      ],
    })
    const content = resp.choices[0]?.message?.content ?? ""
    const luneaLines = content
      .split(/\n+/)
      .map(s => s.replace(/^\s*[-・●\d\.]+\s*/, ""))
      .filter(Boolean)
      .slice(0, 5)

    return NextResponse.json({ ok: true, result: { luneaLines } })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({ ok: true })
}
