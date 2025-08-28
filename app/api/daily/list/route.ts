// -------------------------------------------------------------
// FILE: app/api/daily/list/route.ts
// -------------------------------------------------------------
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
const supabase = createClient(
process.env.NEXT_PUBLIC_SUPABASE_URL!,
process.env.SUPABASE_ANON_KEY!
)

try {
const { searchParams } = new URL(req.url)
const limitRaw = searchParams.get('limit') ?? '20'
const user_id = searchParams.get('user_id')

const limit = Math.max(1, Math.min(parseInt(limitRaw, 10) || 20, 100))

let query = supabase
.from('daily_results')
.select('id, user_id, code, navigator, mode, choice, theme, created_at')
.order('created_at', { ascending: false })
.limit(limit)

if (user_id) query = query.eq('user_id', user_id)

const { data, error } = await query
if (error) throw error

// 表示用正規化（"ヨ"/"∃" → "Ǝ"、"A" → "Λ" など）
const norm = (c: string) => {
const x = (c || '').trim()
if (x === '∃' || x === 'ヨ') return 'Ǝ'
if (x === 'A') return 'Λ'
return (['E', 'V', 'Λ', 'Ǝ'].includes(x) ? x : x) as string
}

const normalized = (data || []).map((r) => ({ ...r, code: norm(r.code) }))

return NextResponse.json({ ok: true, data: normalized }, { status: 200 })
} catch (err: unknown) {
const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown_error'
return NextResponse.json({ ok: false, error: message }, { status: 500 })
}
}
