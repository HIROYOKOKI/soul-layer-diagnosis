// app/api/daily/question/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'            // Edgeでも可だが、まずはNodeで安定運用
export const dynamic = 'force-dynamic'     // 事前レンダ収集で叩かれても常に動的

// 失敗時・キー未設定時のフォールバック
const FALLBACK = {
  question: '今日はどんな気持ちで一日を始めたい？',
  choices: [
    { code: 'E', label: 'とにかく動き出す', hint: '衝動・情熱' },
    { code: 'V', label: '新しい可能性を広げたい', hint: '夢・直感' },
    { code: 'Λ', label: '慎重に考えて選びたい', hint: '選択・臨界' },
    { code: 'Ǝ', label: '静かに観察したい', hint: '観測・記憶' },
  ],
}

export async function GET() {
  try {
    const key = process.env.OPENAI_API_KEY
    if (!key) {
      // キー未設定でもビルド/実行が落ちないようにフォールバックで返す
      return NextResponse.json(FALLBACK, {
        headers: { 'x-ai': 'off' },
      })
    }

    // 動的インポート（ビルド時評価を避ける）
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey: key })

    const prompt = `
あなたは「ソウルレイヤー診断」のナビゲータです。
直感で答えられるシンプルな質問を1つ生成してください。
必ず以下のJSONだけを出力します。

{
  "question": "質問文（日本語）",
  "choices": [
    { "code": "E", "label": "選択肢1", "hint": "短い説明" },
    { "code": "V", "label": "選択肢2", "hint": "短い説明" },
    { "code": "Λ", "label": "選択肢3", "hint": "短い説明" },
    { "code": "Ǝ", "label": "選択肢4", "hint": "短い説明" }
  ]
}
    `.trim()

    // 好きなモデルに変更OK（gpt-4o-mini等）
    const res = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'system', content: prompt }],
    
    })

    const text = res.choices?.[0]?.message?.content?.trim()
    if (!text) return NextResponse.json(FALLBACK, { headers: { 'x-ai': 'empty' } })

    // JSON だけで来ない可能性に備えて、コードブロックを剥がす
    const jsonText = text.replace(/^```json\s*|\s*```$/g, '')
    const data = JSON.parse(jsonText)
    // 最低限のバリデーション
    if (!Array.isArray(data?.choices) || data.choices.length !== 4) {
      return NextResponse.json(FALLBACK, { headers: { 'x-ai': 'invalid-shape' } })
    }

    return NextResponse.json(data, { headers: { 'x-ai': 'on' } })
  } catch (err) {
    console.error('[daily/question] error:', err)
    return NextResponse.json(FALLBACK, { headers: { 'x-ai': 'error' } })
  }
}
