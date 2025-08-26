// app/api/profile/save/route.ts

import { NextResponse } from 'next/server'
// import { createClient } from '@supabase/supabase-js'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, birthday, blood, gender, preference } = body

    // 簡易バリデーション
    if (!name || !birthday || !blood || !gender) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // === Supabase保存例 ===
    // const supabase = createClient(
    //   process.env.NEXT_PUBLIC_SUPABASE_URL!,
    //   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    // )
    // const { data, error } = await supabase
    //   .from('profile_results')
    //   .insert([{ name, birthday, blood, gender, preference }])
    // if (error) throw error

    // 保存が成功したと仮定してレスポンス返す
    return NextResponse.json({
      success: true,
      message: 'Profile saved successfully',
      data: { name, birthday, blood, gender, preference },
    })
  } catch (err: any) {
    console.error('Save error:', err)
    return NextResponse.json(
      { error: 'Failed to save profile' },
      { status: 500 }
    )
  }
}
