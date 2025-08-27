// app/api/structure/quick/save/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

type Body = {
  code: 'E' | 'V' | 'Λ' | 'Ǝ'
  type_label: string
  comment?: string
  scores?: { E?: number; V?: number; 'Λ'?: number; 'Ǝ'?: number }
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

    if (!body || !body.code || !body.type_label) {
      return NextResponse.json({ ok: false, error: 'INVALID_PAYLOAD' }, { status: 400 })
    }

    const weight = 0.5
    const rawE = body.scores?.E ?? 0
    const rawV = body.scores?.V ?? 0
    const rawL = body.scores?.['Λ'] ?? 0
    const rawR = body.scores?.['Ǝ'] ?? 0

    const addOne = !body.scores
    const e_base = rawE + (addOne && body.code === 'E' ? 1 : 0)
    const v_base = rawV + (addOne && body.code === 'V' ? 1 : 0)
    const l_base = rawL + (addOne && body.code === 'Λ' ? 1 : 0)
    const r_base = rawR + (addOne && body.code === 'Ǝ' ? 1 : 0)

    const { data, error } = await supabase
      .from('structure_results')
      .insert([
        {
          user_id: body.user_id ?? null,
          type_label: body.type_label,
          comment: body.comment ?? null,
          e_score: e_base * weight,
          v_score: v_base * weight,
          lambda_score: l_base * weight,
          e_rev_score: r_base * weight,
        },
      ])
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
