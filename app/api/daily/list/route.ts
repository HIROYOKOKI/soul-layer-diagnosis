// app/api/daily/list/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: Request) {
  try {
    const urlObj = new URL(req.url)
    const limitRaw = urlObj.searchParams.get('limit') ?? '20'
    const userId = urlObj.searchParams.get('user_id')
    const diag = urlObj.searchParams.get('diag') === '1'

    // ENV 読み取り（名称ゆらぎ対応）
    const supabaseUrl =
      (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
    const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
    const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim()

    const usingServiceRole = serviceKey.length > 0
    const supabaseKey = usingServiceRole ? serviceKey : anonKey

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        {
          ok: false,
          error:
            'env_missing: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_(SERVICE_ROLE_KEY|ANON_KEY)',
          diag: diag
            ? {
                hasUrl: Boolean(supabaseUrl),
                hasServiceRole: Boolean(serviceKey),
                hasAnon: Boolean(anonKey),
              }
            : undefined,
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

    if (userId) query = query.eq('user_id', userId)

    const { data, error } = await query
    if (error) {
      const status =
        /permission denied/i.test(error.message) || (error as any)?.code === 'PGRST301'
          ? 403
          : 500
      return NextResponse.json(
        {
          ok: false,
          error: error.message || 'supabase_error',
          diag: diag
            ? {
                usingServiceRole,
                code: (error as any)?.code ?? null,
                details: (error as any)?.details ?? null,
                hint: (error as any)?.hint ?? null,
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
    const normalized = (data || []).map((r) => ({ ...r, code: norm(r.code as string) }))

    return NextResponse.json(
      { ok: true, data: normalized, diag: diag ? { usingServiceRole } : undefined },
      { status: 200 },
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
