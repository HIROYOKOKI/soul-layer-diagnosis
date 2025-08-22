import { NextResponse } from 'next/server'

type Score = { E: number; V: number; Λ: number; Ǝ: number }

type Body = {
  userId?: string
  theme?: 'work' | 'love' | 'future' | 'self'
  choice?: 'E' | 'V' | 'Λ' | 'Ǝ'
  structure_score?: Partial<Score>
  comment?: string
  advice?: string
}

// POST /api/daily/save
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    // （いまは保存せず受け取った内容を返すだけのスタブ）
    return NextResponse.json({ ok: true, received: body })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? String(err) },
      { status: 400 }
    )
  }
}
