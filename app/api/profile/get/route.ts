// app/api/profile/get/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function readEnv() {
  const url =
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim()
  const key = serviceKey || anonKey
  return { url, key, usingServiceRole: Boolean(serviceKey) }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const id = (searchParams.get('id') || '').trim()
    if (!id) {
      return NextResponse.json({ ok: false, error: 'id required' }, { status: 400 })
    }

    const { url, key, usingServiceRole } = readEnv()
    if (!url || !key) {
      return NextResponse.json(
        {
          ok: false,
          error: 'env_missing: SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_(SERVICE_ROLE_KEY|ANON_KEY)',
        },
        { status: 500 }
      )
    }

    const sb = createClient(url, key, {
      global: { headers: { 'X-Client-Info': 'profile-get-v1' } },
    })

    const { data, error } = await sb
      .from('profile_results')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      const status =
        /permission denied/i.test(error.message) ? 403 : 500
      return NextResponse.json(
        { ok: false, error: error.message || 'supabase_select_failed', diag: { usingServiceRole } },
        { status }
      )
    }

    return NextResponse.json(
      { ok: true, data, diag: { usingServiceRole } },
      { status: 200 }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
