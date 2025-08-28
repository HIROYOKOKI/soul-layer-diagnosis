// app/api/daily/diagnose/route.ts
import { NextResponse } from 'next/server'
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type Code = 'E'|'V'|'Λ'|'Ǝ'
function isCode(v: unknown): v is Code { return v==='E'||v==='V'||v==='Λ'||v==='Ǝ' }

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const code = body?.code as unknown
    if (!isCode(code)) return NextResponse.json({ error:'invalid code' }, { status:400 })

    return NextResponse.json({
      comment: `観測結果：${code} の構造が強く現れています。`,
      advice: '小さな仮説を1つ立てて、30分だけ動いてみよう。',
      quote: '「想像力は知識よりも重要だ。」— アインシュタイン',
    })
  } catch {
    return NextResponse.json({ error:'invalid request' }, { status:400 })
  }
}
