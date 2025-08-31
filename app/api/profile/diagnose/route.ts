<<<<<<< HEAD
// app/api/profile/diagnose/route.ts
import { NextResponse } from "next/server"
import OpenAI from "openai"

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })
=======
import { NextResponse } from "next/server"
import { getOpenAI } from "../../../../lib/openai"
>>>>>>> e65b975 (Result UI仕上げ: Luneaタイプライター／保存→MyPage反映／mypage API)

type Body = {
  name: string
  birthday: string
  blood: string
  gender: string
  preference?: string | null
}

<<<<<<< HEAD
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
=======
export async function POST(req: Request) {
  const b = (await req.json()) as Partial<Body>
  const { name, birthday, blood, gender, preference } = b
  if (!name || !birthday || !blood || !gender) {
    return NextResponse.json({ ok:false, error:"missing_params" }, { status:400 })
  }

  const ai = getOpenAI()
  const sys = "あなたは『ソウルレイヤー診断』のナビゲータ“ルネア”。各要素は80字以内、日本語で前向きに。"
  const user = `
入力:
- 名前:${name}
- 誕生日:${birthday}
- 血液型:${blood}
- 性別:${gender}
- 恋愛対象:${preference ?? "未設定"}

出力(JSON):
{"fortune":"","personality":"","partner":"","opening":"","closing":""}`.trim()

  let fortune = "今日は静かに整えるほど運が開きます。"
  let personality = "静けさの中に情熱を秘めるタイプ。"
  let partner = "自由に夢を語れる相手が最良です。"
  let opening = "観測しました──お伝えします。"
  let closing = "以上がいま映ったあなたです。"

  if (ai) {
    const r = await ai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.7,
      response_format: { type:"json_object" },
      messages: [{ role:"system", content: sys }, { role:"user", content: user }],
    })
    try {
      const parsed = JSON.parse(r.choices?.[0]?.message?.content ?? "{}") as Partial<Record<string,string>>
      fortune = (parsed.fortune ?? fortune).slice(0,80)
      personality = (parsed.personality ?? personality).slice(0,80)
      partner = (parsed.partner ?? partner).slice(0,80)
      opening = (parsed.opening ?? opening).slice(0,60)
      closing = (parsed.closing ?? closing).slice(0,60)
    } catch {}
  }

  const luneaLines = [
    { type:"opening", label:"観測", text:opening },
    { type:"fortune", label:"総合運勢", text:fortune },
    { type:"personality", label:"性格傾向", text:personality },
    { type:"partner", label:"理想のパートナー", text:partner },
    { type:"closing", label:"締め", text:closing },
  ]
  return NextResponse.json({ ok:true, result:{ fortune, personality, partner, luneaLines } })
>>>>>>> e65b975 (Result UI仕上げ: Luneaタイプライター／保存→MyPage反映／mypage API)
}
