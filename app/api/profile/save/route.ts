// app/api/profile/save/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

// --- Supabase Server Client (Server-side env) ---
// 環境変数（Vercel Project Settings / .env.local）
// SUPABASE_URL=...                 ← https://xxxxx.supabase.co
// SUPABASE_SERVICE_ROLE_KEY=...    ← Service Role（公開厳禁）
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)')
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false },
})

type ProfilePayload = {
  name: string
  birthday: string
  blood: string
  gender: string
  preference?: string
}

export async function POST(req: Request) {
  try {
    const body: ProfilePayload = await req.json()
    const { name, birthday, blood, gender, preference } = body

    // 必須チェック
    if (!name || !birthday || !blood || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // --- Supabase Insert ---
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
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error('Save error:', err instanceof Error ? err.message : err)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
