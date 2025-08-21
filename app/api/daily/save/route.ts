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

<<<<<<< HEAD
    // TODO: ここで Supabase へ保存する。今はビルド優先のスタブ。
=======
    // TODO: Supabase保存は後で実装。今はビルドを通すスタブ。
>>>>>>> 405686b (fix: clean daily save route (remove conflict markers))
    // 例:
    // const sb = getSb()
    // await sb.from('daily_results').insert({ ...body, created_at: new Date().toISOString() })

    return NextResponse.json({ ok: true, received: body })
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: (err as Error).message ?? String(err) },
<<<<<<< HEAD
      { status: 400 },
=======
      { status: 400 }
>>>>>>> 405686b (fix: clean daily save route (remove conflict markers))
    )
  }
}
