// app/api/daily/diagnose/route.ts
import { NextResponse } from 'next/server'

export const runtime = 'nodejs' // Edge ではなく Node 実行に固定（openai 互換性）

type Score = { E: number; V: number; Λ: number; Ǝ: number }
type Theme = 'work' | 'love' | 'future' | 'self'
type Choice = 'E' | 'V' | 'Λ' | 'Ǝ'
type Body = { userId?: string; theme?: Theme; structure_score?: Score; choice?: Choice }

function isValidTheme(t: any): t is Theme {
  return t === 'work' || t === 'love' || t === 'future' || t === 'self'
}
function hasScore(s: any): s is Score {
  return !!s && ['E', 'V', 'Λ', 'Ǝ'].every((k) => typeof s[k as keyof Score] === 'number')
}

async function getOpenAI() {
  if (process.env.NO_LLM === '1') return null
  const key = process.env.OPENAI_API_KEY
  if (!key) return null
  const OpenAI = (await import('openai')).default as any
  return new OpenAI({ apiKey: key })
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body

    if (!isValidTheme(body.theme) || !hasScore(body.structure_score)) {
      return NextResponse.json(
        { error: 'bad_request', detail: 'theme と structure_score は必須です。' },
        { status: 400 }
      )
    }

    const { theme, structure_score, choice } = body
    const prompt = [
      'あなたはAIキャラクター「ルネア」。',
      '入力（テーマ/E・V・Λ・Ǝのスコア/回答選択）を踏まえ、',
      '次の2つを日本語で返してください：',
      '1) 【ルネアからのメッセージ】（120〜180字）',
      '2) 【ルネアからの一言アドバイス】（1行）',
      '',
      `テーマ: ${theme}`,
      `スコア: E=${structure_score.E}, V=${structure_score.V}, Λ=${structure_score.Λ}, Ǝ=${structure_score.Ǝ}`,
      `今日の選択: ${choice ?? '（未選択）'}`,
      '出力は箇条書きではなく、自然な文章で。'
    ].join('\n')

    const client = await getOpenAI()

    // LLM未接続 or キー未設定 → スタブ応答
    if (!client) {
      const msg =
        `【ルネアからのメッセージ】\n` +
        `今日の観測テーマは「${theme}」。E/V/Λ/Ǝのバランス（E:${structure_score.E}, V:${structure_score.V}, Λ:${structure_score.Λ}, Ǝ:${structure_score.Ǝ}）から、` +
        `あなたの意識は静かに前へ進む準備が整っています。小さな選択（${choice ?? '未選択'}）でも、今日の一歩が形を与えます。` +
        `結果ではなく「今の自分の向き」を丁寧に確かめてください。`
      const advice = '今日の一歩を大切に。'
      return NextResponse.json({ comment: msg, advice, mode: 'stub' })
    }

    // 本番（OpenAI）
    const r = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7
    })
    const text: string = r.choices?.[0]?.message?.content ?? ''
    // 返却は UI 側で見出しを付けやすいように分離
    return NextResponse.json({ comment: text, advice: '今日の一歩を大切に。', mode: 'llm' })
  } catch (err: any) {
    return NextResponse.json(
      { error: 'server_error', detail: String(err?.message ?? err) },
      { status: 500 }
    )
  }
}

export function GET() {
  // ヘルス用（GETで簡易モード確認）
  return NextResponse.json({ ok: true, endpoint: '/api/daily/diagnose' })
}
