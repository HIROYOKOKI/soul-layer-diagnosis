// app/api/daily/save/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs' // Nodeで実行（Edge不可）

type Score = { E: number; V: number; Λ: number; Ǝ: number }
type Theme = 'work' | 'love' | 'future' | 'self'
type Choice = 'E' | 'V' | 'Λ' | 'Ǝ'
type Body = {
  userId?: string
  theme?: Theme
  choice?: Choice
  structure_score?: Partial<Score>
  comment?: string
  advice?: string
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) return null
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

const okTheme = new Set<Theme>(['work', 'love', 'future', 'self'])
const okChoice = new Set<Choice>(['E', 'V', 'Λ', 'Ǝ'])

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body
    const sb = getSupabase()
    if (!sb) {
      return NextResponse.json(
        { error: 'supabase_not_configured', detail: 'Set NEXT_PUBLIC_SUPABASE_URL & SUPABASE_SERVICE_ROLE_KEY' },
        { status: 503 }
      )
    }

    if (!body.theme || !okTheme.has(body.theme)) {
      return NextResponse.json({ error: 'bad_request', detail: 'theme is required' }, { status: 400 })
    }

    const payload = {
      user_id: body.userId ?? 'guest',
      theme: body.theme,
      choice: body.choice && okChoice.has(body.choice) ? body.choice : null,
      structure_score: {
        E: Number(body.structure_score?.E ?? 0),
        V: Number(body.structure_score?.V ?? 0),
        Λ: Number(body.structure_score?.Λ ?? 0),
        Ǝ: Number(body.structure_score?.Ǝ ?? 0),
      },
      comment: body.comment ?? null,
      advice: body.advice ?? null,
    }

    const { data, error } = await sb
      .from('daily_results')
      .insert([payload])
      .select('id, created_at')
      .single()

    if (error) {
      return NextResponse.json({ error: 'insert_failed', detail: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, id: data?.id, created_at: data?.created_at })
  } catch (e: any) {
    return NextResponse.json({ error: 'server_error', detail: String(e?.message ?? e) }, { status: 500 })
  }
}

export function GET() {
  // 簡易ヘルス
  return NextResponse.json({ ok: true, endpoint: '/api/daily/save' })
}
