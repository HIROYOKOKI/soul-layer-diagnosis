// app/api/profile/save/route.ts

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// --- Supabase Server Client (Service Roleを使用) ---
// 環境変数に以下を設定してください（.env.local など）
// SUPABASE_URL=...        ← https://xxxxx.supabase.co
// SUPABASE_SERVICE_ROLE_KEY=...  ← サーバー専用のService Role Key（公開しない）
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false } }
)

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, birthday, blood, gender, preference } = body ?? {}

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
  } catch (err: any) {
    console.error('Save error:', err)
    return NextResponse.json({ error: 'Failed to save profile' }, { status: 500 })
  }
}
