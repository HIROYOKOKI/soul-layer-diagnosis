// app/api/profile/diagnose/route.ts
import { NextResponse } from "next/server"

type Req = {
  name: string
  birthday: string
  blood: "A" | "B" | "O" | "AB" | string
  gender: "Male" | "Female" | "Other" | string
  preference?: "Female" | "Male" | "Both" | "" | null | string
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<Req>
    const { name = "あなた", birthday = "", blood = "", gender = "", preference = "" } = body

    const sys = `あなたはAIキャラクター「ルネア」。口調はやさしく短文で、1行ずつ詩のように語りかける。`
    const user = `プロフィール:
- 名前: ${name}
- 誕生日: ${birthday}
- 血液型: ${blood}
- 性別: ${gender}
- 恋愛対象: ${preference || "未指定"}

出力:
1行ずつ短文で5〜7行。最初は「観測が終わったよ。」で始め、
「運勢」「性格傾向」「理想」「今日の灯り」などの要素を入れる。
最後は「――ルネア」では締めず、余韻で終える。`

    let luneaLines: string[] = []

    const key = process.env.OPENAI_API_KEY || process.env.OPENAI_APIKEY
    if (key) {
      // OpenAI利用（標準FetchでOK）
      const resp = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${key}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: sys },
            { role: "user", content: user },
          ],
          temperature: 0.8,
        }),
      })
      const json = await resp.json()
      const text: string =
        json?.choices?.[0]?.message?.content?.toString?.() ??
        "観測が終わったよ。\n今日の灯りは、静かに君を照らしている。"
      luneaLines = text.split(/\r?\n/).map(s => s.trim()).filter(Boolean).slice(0, 7)
    } else {
      // フォールバック（APIキーなしでも動く）
      luneaLines = [
        "観測が終わったよ。これが、きみの“いま”だよ。",
        `誕生日のリズムから、${name}の内側にある静かな推進力を見た。`,
        `血液型:${blood} は、配慮とバランス感覚を呼びやすい。`,
        "今日の運勢は“整える”。小さな段差をならすと、大きな流れが戻ってくる。",
        "性格傾向は、決める前に一呼吸。観測してから選ぶタイプ。",
        "理想は“丁寧さと遊び心”の両立。硬さに紫の光を一滴だけ。",
        "最後に――無理はしないで。充分、美しいよ。",
      ]
    }

    return NextResponse.json({
      ok: true,
      result: {
        name,
        summary: `${name}のプロフィール診断`,
        luneaLines,
      },
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "diagnose_failed" }, { status: 500 })
  }
}
