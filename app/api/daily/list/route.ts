-----------------------------------------------------------------

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
try {
const { searchParams } = new URL(req.url)
const limitRaw = searchParams.get('limit') ?? '20'
const user_id = searchParams.get('user_id')
const diag = searchParams.get('diag') === '1'

// --- ENV 取得（名称ゆらぎにも対応） ---
const urlRaw = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL
const svcRaw = process.env.SUPABASE_SERVICE_ROLE_KEY
const anonRaw = process.env.SUPABASE_ANON_KEY
const url = urlRaw?.trim()
const svc = svcRaw?.trim()
const anon = anonRaw?.trim()
const usingServiceRole = Boolean(svc && svc.length > 0)
const key = usingServiceRole ? svc! : (anon || '')

if (!url || !key) {
return NextResponse.json(
{
ok: false,
error: 'env_missing: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_(SERVICE_ROLE_KEY|ANON_KEY)',
diag: diag ? { urlVarUsed: url ? (process.env.SUPABASE_URL ? 'SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_URL') : null, hasServiceRole: Boolean(svc), hasAnon: Boolean(anon), region: process.env.VERCEL_REGION } : undefined,
},
{ status: 500 }
)
}

const supabase = createClient(url, key, { global: { headers: { 'X-Client-Info': 'mypage-list-v1.8' } } })

const limit = Math.max(1, Math.min(parseInt(limitRaw, 10) || 20, 100))

let query = supabase
.from('daily_results')
.select('id, user_id, code, navigator, mode, choice, theme, created_at')
.order('created_at', { ascending: false })
.limit(limit)

if (user_id) query = query.eq('user_id', user_id)

const { data, error } = await query
if (error) {
const payload = {
ok: false as const,
error: error.message || 'supabase_error',
diag: diag ? {
code: (error as any)?.code ?? null,
details: (error as any)?.details ?? null,
hint: (error as any)?.hint ?? null,
usingServiceRole,
urlVarUsed: process.env.SUPABASE_URL ? 'SUPABASE_URL' : 'NEXT_PUBLIC_SUPABASE_URL',
} : undefined,
}
const status = (error as any)?.code === 'PGRST301' || /permission denied/i.test(String(error.message)) ? 403 : 500
return NextResponse.json(payload, { status })
}

// 表示用正規化（"ヨ"/"∃" → "Ǝ"、"A" → "Λ" など）
const norm = (c: string) => {
const x = (c || '').trim()
if (x === '∃' || x === 'ヨ') return 'Ǝ'
if (x === 'A') return 'Λ'
return (['E', 'V', 'Λ', 'Ǝ'].includes(x) ? x : x) as string
}

const normalized = (data || []).map((r) => ({ ...r, code: norm(r.code) }))

return NextResponse.json({ ok: true, data: normalized, diag: diag ? { count: normalized.length, usingServiceRole } : undefined }, { status: 200 })
} catch (err: unknown) {
const message = err instanceof Error ? err.message : typeof err === 'string' ? err : 'unknown_error'
return NextResponse.json({ ok: false, error: message }, { status: 500 })
}
}
