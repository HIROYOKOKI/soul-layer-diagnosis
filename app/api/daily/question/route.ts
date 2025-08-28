// app/api/daily/question/route.ts
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // 環境変数に必須
})

export async function GET() {
  try {
    // プロンプト: デイリー診断用の1問4択を生成
    const prompt = `
あなたは「ソウルレイヤー診断」のナビゲータです。
今日の直感で答えられるようなシンプルな質問を1つ生成してください。
形式は必ず以下のJSONで出力してください：

{
  "question": "質問文（日本語）",
  "choices": [
    { "code": "E", "label": "選択肢1", "hint": "短い説明" },
    { "code": "V", "label": "選択肢2", "hint": "短い説明" },
    { "code": "Λ", "label": "選択肢3", "hint": "短い説明" },
    { "code": "Ǝ", "label": "選択肢4", "hint": "短い説明" }
  ]
}
    `

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
      temperature: 0.8,
    })

    const text = completion.choices[0].message?.content
    if (!text) throw new Error('No content from model')

    // JSONパース
    const data = JSON.parse(text)
    return NextResponse.json(data)
  } catch (err) {
    console.error(err)
    return NextResponse.json(
      { error: '質問生成に失敗しました' },
      { status: 500 }
    )
  }
}
