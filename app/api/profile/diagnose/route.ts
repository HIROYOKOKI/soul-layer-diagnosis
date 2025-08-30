// app/api/profile/diagnose/route.ts
import { NextResponse } from "next/server"
import OpenAI from "openai"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

type Body = {
  name: string
  birthday: string
  blood: string
  gender: string
  preference?: string | null
}

type Gen = {
  fortune: string
  personality: string
  partner: string
  opening?: string
  closing?: string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Body>
    const { name, birthday, blood, gender, preference } = body

    if (!name || !birthday || !blood || !gender) {
      return NextResponse.json(
        { ok: false, error: "missing_params" },
        { status: 400 }
      )
    }

    const sys =
      "あなたは『ソウルレイヤー診断』のナビゲータ“ルネア”。柔らかく観測者に語りかける口調。各要素は80字以内、日本語で簡潔に。"

    const user = `
入力:
- 名前: ${name}
- 誕生日: ${birthday}
- 血液型: ${blood}
- 性別: ${gender}
- 恋愛対象: ${preference ?? "未設定"}

出力フォーマット(JSON):
{
 "fortune":"総合運勢（80字以内）",
 "personality":"性格傾向（80字以内）",
 "partner":"理想のパートナー像（80字以内）",
 "opening":"観測開始の一言（40字程度）",
 "closing":"締めの一言（40字程度）"
}`.trim()

    const r = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: sys },
        { role: "user", content: user },
      ],
    })

    const content = r.choices?.[0]?.message?.content ?? "{}"

    let parsed: Partial<Gen> = {}
    try {
      parsed = JSON.parse(content) as Partial<Gen>
    } catch {
      parsed = {}
    }

    const fortune = String(parsed.fortune ?? "").slice(0, 80)
    const personality = String(parsed.personality ?? "").slice(0, 80)
    const partner = String(parsed.partner ?? "").slice(0, 80)
    const opening = String(parsed.opening ?? "観測しました──お伝えします。").slice(0, 60)
    const closing = String(parsed.closing ?? "以上がいま映ったあなたです。").slice(0, 60)

    const luneaLines: Array<{ type: string; label: string; text: string }> = [
      { type: "opening", label: "観測", text: opening },
      { type: "fortune", label: "総合運勢", text: fortune },
      { type: "personality", label: "性格傾向", text: personality },
      { type: "partner", label: "理想のパートナー像", text: partner },
      { type: "closing", label: "締め", text: closing },
    ]

    return NextResponse.json({
      ok: true,
      result: { fortune, personality, partner, luneaLines },
    })
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err)
    return NextResponse.json(
      { ok: false, error: "internal_error", detail },
      { status: 500 }
    )
  }
}
