// app/api/structure/quick/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Body = {
  // 画面で選んだ結果
  code: 'E' | 'V' | 'Λ' | 'Ǝ'
  type_label: string          // 例: 'ΛEƎV型'
  comment?: string
  // 任意：生スコア（渡さない場合は code に1点）
  scores?: { E?: number; V?: number; 'Λ'?: number; 'Ǝ'?: number }
  // 任意：アプリで持っている user_id（無ければnull）
  user_id?: string | null
}

export async function POST(req: NextRequest) {
  try {
    const url = process.env.SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !serviceKey) {
      return NextResponse.json({ ok: false, error: 'ENV_MISSING' }, { status: 500 })
    }

    const supabase = createClient(url, serviceKey)
    const body = (await req.json()) as Body

    // 最低限のバリデーション
    if (!body || !body.code || !body.type_label) {
      return NextResponse.json({ ok: false, error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    // クイック診断の係数（0.5）
    const weight = 0.5

    // 生スコアが来ていなければ、選んだ code に1点を与える
    const rawE = body.scores?.E ?? 0
    const rawV = body.scores?.V ?? 0
    const rawL = body.scores?.['Λ'] ?? 0
    const rawR = body.scores?.['Ǝ'] ?? 0

    const addOne = !body.scores // scores未指定なら code に1点
    const e_base = rawE + (addOne && body.code === 'E' ? 1 : 0)
    const v_base = rawV + (addOne && body.code === 'V' ? 1 : 0)
    const l_base = rawL + (addOne && body.code === 'Λ' ? 1 : 0)
    const r_base = rawR + (addOne && body.code === 'Ǝ' ? 1 : 0)

    // 係数を適用（テーブルは分割カラム構成）
    const e_score = e_base * weight
    const v_score = v_base * weight
    const lambda_score = l_base * weight
    const e_rev_score = r_base * weight

    // INSERT（Service Role なのでRLSの制約を受けない）
    const { data, error } = await supabase
      .from('structure_results')
      .insert([
        {
          user_id: body.user_id ?? null,
          type_label: body.type_label,
          comment: body.comment ?? null,
          e_score,
          v_score,
          lambda_score,
          e_rev_score,
          // created_at はデフォルト now() が入る想定
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, record: data }, { status: 200 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'UNKNOWN' }, { status: 500 })
  }
}
