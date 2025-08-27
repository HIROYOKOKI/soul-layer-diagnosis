// app/api/structure/quick/save/route.ts
// ※ このファイルに "export default ..." は置かないでください

import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs' // Edgeでenvが読めない事故を避ける
export const dynamic = 'force-dynamic' // キャッシュ回避

type EVChar = 'E' | 'V' | 'Λ' | 'Ǝ'

type Body = {
  code: EVChar
  type_label: string
  comment?: string
  scores?: Partial<Record<EVChar, number>>
  user_id?: string | null
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  })
}

export async function POST(req: Request): Promise<Response> {
  // ---- env 取得（URL は Public をフォールバック） ----
  const url =
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    ''

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? ''

  if (!url || !serviceKey) {
    return json(
      {
        ok: false,
        error: `ENV_MISSING: url=${url ? 'set' : 'missing'}, role=${serviceKey ? 'set' : 'missing'}`,
      },
      { status: 500 }
    )
  }

  const supabase = createClient(url, serviceKey)

  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ ok: false, error: 'INVALID_JSON' }, { status: 400 })
  }

  if (!body?.code || !body?.type_label) {
    return json({ ok: false, error: 'INVALID_PAYLOAD' }, { status: 400 })
  }

  // ---- クイック診断の係数 ----
  const weight = 0.5

  const addOne = !body.scores
  const rawE = (body.scores?.E ?? 0) + (addOne && body.code === 'E' ? 1 : 0)
  const rawV = (body.scores?.V ?? 0) + (addOne && body.code === 'V' ? 1 : 0)
  const rawL = (body.scores?.['Λ'] ?? 0) + (addOne && body.code === 'Λ' ? 1 : 0)
  const rawR = (body.scores?.['Ǝ'] ?? 0) + (addOne && body.code === 'Ǝ' ? 1 : 0)

  const row = {
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
    return json({ ok: false, error: error.message }, { status: 500 })
  }

  return json({ ok: true, record: data })
}
