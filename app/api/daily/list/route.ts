
import { NextResponse } from 'next/server'
import { createClient, type PostgrestError } from '@supabase/supabase-js'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
try {
const { searchParams } = new URL(req.url)
const limitRaw = searchParams.get('limit') ?? '20'
const user_id = searchParams.get('user_id')
const diag = searchParams.get('diag') === '1'

// ENV 名ゆらぎ対応 + service role を優先
const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '').trim()
const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
const anonKey = (process.env.SUPABASE_ANON_KEY ?? '').trim()
const usingServiceRole = serviceKey.length > 0
const supabaseKey = usingServiceRole ? serviceKey : anonKey

if (!supabaseUrl || !supabaseKey) {
return NextResponse.json(
{
ok: false,
error: 'env_missing: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_(SERVICE_ROLE_KEY|ANON_KEY)',
diag: diag ? { hasUrl: Boolean(supabaseUrl), hasServiceRole: Boolean(serviceKey), hasAnon: Boolean(anonKey) } : undefined,
},
{ status: 500 },
)
}

const supabase = createClient(supabaseUrl, supabaseKey)

const limit = Math.max(1, Math.min(parseInt(limitRaw, 10) || 20, 100))

let query = supabase
.from('daily_results')
.select('id, user_id, code, navigator, mode, choice, theme, created_at')
.order('created_at', { ascending: false })
.limit(limit)

if (user_id) query = query.eq('user_id', user_id)

const { data, error } = await query
if (error) {
const e = error as PostgrestError
const status = e.code === 'PGRST301' || /permission denied/i.test(e.message) ? 403 : 500
return NextResponse.json(
{
ok: false,
error: e.message || 'supabase_error',
diag: diag
? {
code: e.code ?? null,
details: e.details ?? null,
hint: e.hint ?? null,
usingServiceRole,
urlVarUsed: process.env.SUPABASE_URL ? 'SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_URL',
}
: undefined,
},
{ status },
)
}

// コード正規化
const norm = (c: string) => {
const x = (c || '').trim()
if (x === '∃' || x === 'ヨ') return 'Ǝ'
if (x === 'A') return 'Λ'
return ['E', 'V', 'Λ', 'Ǝ'].includes(x) ? x : x
}

const normalized = (data ?? []).map((r) => ({ ...r, code: norm((r as { code: string }).code) }))

return NextResponse.json(
{ ok: true, data: normalized, diag: diag ? { count: normalized.length, usingServiceRole } : undefined },
{ status: 200 },
)
} catch (err: unknown) {
const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown_error'
return NextResponse.json({ ok: false, error: message }, { status: 500 })
}
}
