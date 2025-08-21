import { NextResponse } from 'next/server'
import OpenAI from 'openai'
export const runtime = 'nodejs'

type Score = { E:number; V:number; Λ:number; Ǝ:number }
type Theme = 'work'|'love'|'future'|'self'
type Choice = 'E'|'V'|'Λ'|'Ǝ'
type Body = { userId?:string; theme?:Theme; structure_score?:Score; choice?:Choice }

function isValidTheme(t: unknown): t is Theme {
  return t==='work'||t==='love'||t==='future'||t==='self'
}
function hasScore(s: unknown): s is Score {
  if (!s || typeof s !== 'object') return false
  const o = s as Record<string, unknown>
  return ['E','V','Λ','Ǝ'].every(k => typeof o[k] === 'number')
}
function getClient(): OpenAI | null {
  if (process.env.NO_LLM === '1') return null
  const key = process.env.OPENAI_API_KEY
  return key ? new OpenAI({ apiKey:key }) : null
}

export async function POST(req: Request) {
  const body = (await req.json()) as Body
  if (!isValidTheme(body.theme) || !hasScore(body.structure_score)) {
    return NextResponse.json({ error:'bad_request', detail:'theme と structure_score は必須' }, { status:400 })
  }
  const { theme, structure_score, choice } = body
  const prompt = [
    'あなたはAIキャラクター「ルネア」。',
    '次の2つを日本語で返す：',
    '1) 【ルネアからのメッセージ】（120〜180字）',
    '2) 【ルネアからの一言アドバイス】（1行）',
    `テーマ:${theme} / スコア E:${structure_score.E} V:${structure_score.V} Λ:${structure_score.Λ} Ǝ:${structure_score.Ǝ}`,
    `今日の選択:${choice ?? '未選択'}`,
  ].join('\n')

  const client = getClient()
  if (!client) {
    const msg = `【ルネアからのメッセージ】
今日の観測テーマは「${theme}」。E/V/Λ/Ǝの配分（E:${structure_score.E}, V:${structure_score.V}, Λ:${structure_score.Λ}, Ǝ:${structure_score.Ǝ}）から、今は小さな一歩が形になります。${choice ?? '未選択'}という選択も含め、向きを丁寧に確かめましょう。`
    return NextResponse.json({ comment: msg, advice: '今日の一歩を大切に。', mode:'stub' })
  }

  const r = await client.chat.completions.create({
    model:'gpt-4o-mini',
    messages:[{ role:'user', content: prompt }],
    temperature:0.7,
  })
  const text = r.choices?.[0]?.message?.content ?? ''
  return NextResponse.json({ comment:text, advice:'今日の一歩を大切に。', mode:'llm' })
}

export function GET(){ return NextResponse.json({ ok:true, endpoint:'/api/daily/diagnose' }) }
