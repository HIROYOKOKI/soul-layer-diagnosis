// app/api/profile/save/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

type SaveBody = {
  name?: string
  birthday?: string
  blood?: string
  gender?: string
  preference?: string
  fortune?: string
  personality?: string
  ideal_partner?: string
}

function readEnv() {
  const url =
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').trim()
  const serviceKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  const anonKey = (process.env.SUPABASE_ANON_KEY || '').trim()
  const key = serviceKey || anonKey
  return { url, key, usingServiceRole: Boolean(serviceKey) }
}

export async function POST(req: Request) {
  try {
    let bodyUnknown: unknown
    try {
      bodyUnknown = await req.json()
    } catch {
      bodyUnknown = {}
    }
    const body = (bodyUnknown || {}) as SaveBody

    const name = typeof body.name === 'string' ? body.name.trim() : ''
    const birthday = typeof body.birthday === 'string' ? body.birthday.trim() : ''
    const blood = typeof body.blood === 'string' ? body.blood.trim() : ''
    const gender = typeof body.gender === 'string' ? body.gender.trim() : ''
    const preference = typeof body.preference === 'string' ? body.preference.trim() : ''
    const fortune = typeof body.fortune === 'string' ? body.fortune.trim() : ''
    const personality = typeof body.personality === 'string' ? body.personality.trim() : ''
    const ideal_partner = typeof body.ideal_partner === 'string' ? body.ideal_partner.trim() : ''

    // 必須チェック（最小限）
    if (!name || !birthday || !blood || !gender) {
      return NextResponse.json(
        { ok: false, error: 'missing_required_fields' },
        { status: 400 }
      )
    }
    if (!fortune || !personality || !ideal_partner) {
      return NextResponse.json(
        { ok: false, error: 'missing_diagnose_fields' },
        { status: 400 }
      )
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
      global: { headers: { 'X-Client-Info': 'profile-save-v1' } },
    })

    const { data, error } = await sb
      .from('profile_results')
      .insert({
        user_id: null, // 認証導入後は auth.uid() を入れる
        name,
        birthday,
        blood,
        gender,
        preference,
        fortune,
        personality,
        ideal_partner,
      })
      .select('id')
      .single()

    if (error) {
      // RLS 不許可などもここに来る（service role 推奨）
      return NextResponse.json(
        {
          ok: false,
          error: error.message || 'supabase_insert_failed',
          diag: { usingServiceRole },
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { ok: true, id: data!.id, diag: { usingServiceRole } },
      { status: 200 }
    )
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
