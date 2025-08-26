// app/api/profile/save/route.ts

import { NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

export const runtime = 'nodejs' // EdgeではなくNodeで

type ProfilePayload = {
  name: string
  birthday: string
  blood: string
  gender: string
  preference?: string
}

// 環境変数から実行時にSupabaseクライアントを作る
function getSupabase(): SupabaseClient {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    // 実行時にわかりやすいエラーを返す
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function POST(req: Request) {
  try {
    const body: ProfilePayload = await req.json()
    const { name, birthday, blood, gender, preference } = body ?? {}

    // 必須チェック
    if (!name || !birthday || !blood || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = getSupabase()

    // Insert
    const { data, error } = await supabase
      .from('profile_results')
      .insert([{ name, birthday, blood, gender, preference }])
      .select()
      .single()

    if (error) {
      console.error('[Supabase] insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      data,
    })
  } catch (err: any) {
    console.error('Save error:', err)
    const msg =
      err?.message?.includes('Missing SUPABASE_URL') ?
      'Server env vars not set' : 'Failed to save profile'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
