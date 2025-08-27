// app/api/structure/quick/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type EVChar = 'E' | 'V' | 'Λ' | 'Ǝ'

type Body = {
  code: EVChar
  type_label: string
  comment?: string
  scores?: Partial<Record<EVChar, number>>
  user_id?: string | null
}

type InsertRow = {
  user_id: string | null
  type_label: string
  comment: string | null
  e_score: number
  v_score: number
  lambda_score: number
  e_rev_score: number
  // created_at は DB 既定の now()
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
    if (!body?.code || !body?.type_label) {
      return NextResponse.json({ ok: false, error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    // クイック診断の係数
    const weight = 0.5

    // 生スコア（未指定なら選択コードに1点）
    const addOne = !body.scores
    const rawE = (body.scores?.E ?? 0) + (addOne && body.code === 'E' ? 1 : 0)
    const rawV = (body.scores?.V ?? 0) + (addOne && body.code === 'V' ? 1 : 0)
    const rawL = (body.scores?.['Λ'] ?? 0) + (addOne && body.code === 'Λ' ? 1 : 0)
    const rawR = (body.scores?.['Ǝ'] ?? 0) + (addOne && body.code === 'Ǝ' ? 1 : 0)

    const row: InsertRow = {
      user_id: body.user_id ?? null,
      type_label: body.type_label,
      comment: body.comment ?? null,
      e_score: rawE * weight,
      v_score: rawV * weight,
      lambda_score: rawL * weight,
      e_rev_score: rawR * weight,
    }

    const { data, error } = await supabase
      .from('structure_results')
      .insert([row])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, record: data }, { status: 200 })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
