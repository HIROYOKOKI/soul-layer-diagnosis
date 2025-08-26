// app/api/profile/save/route.ts

import { NextResponse } from 'next/server'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs' // Edge回避

type ProfilePayload = {
  name: string
  birthday: string
  blood: string
  gender: string
  preference?: string
}

// 実行時にSupabaseクライアントを生成（ビルド時にthrowしない）
function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    // ここではthrowせず、上位catchで500を返すためErrorを投げる
    throw new Error('Server env vars not set: SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: Request) {
  try {
    const body: ProfilePayload = await req.json()
    const { name, birthday, blood, gender, preference } = body ?? {}

    // 必須チェック
    if (!name || !birthday || !blood || !gender) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabase = getSupabase()

    const { data, error } = await supabase
  .from('profile_results')
  .insert([{ name, birthday, blood, gender, preference }])
  .select('id,name,birthday,blood,gender,preference,created_at')
  .single()

if (error) {
  console.error('[Supabase] insert error:', error)
  return NextResponse.json({ error: error.message }, { status: 500 })
}

return NextResponse.json({
  success: true,
  id: data.id, // ← ここで返す
  data,
})

  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('Save error:', err instanceof Error ? err.message : err)
    const msg =
      err instanceof Error && err.message.includes('Server env vars not set')
        ? 'Server env vars not set'
        : 'Failed to save profile'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
