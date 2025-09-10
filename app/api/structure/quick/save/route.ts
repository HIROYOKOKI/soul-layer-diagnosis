// app/api/structure/quick/save/route.ts
// ※ このファイルに "export default ..." は置かないでください

import { getSupabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs"          // Edgeでenvが読めない事故を避ける
export const dynamic = "force-dynamic"   // キャッシュ回避

type EVChar = "E" | "V" | "Λ" | "Ǝ"

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
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}

export async function POST(req: Request): Promise<Response> {
  // --- Admin クライアント（env は supabase-admin.ts 側で検証） ---
  const sb = getSupabaseAdmin()
  if (!sb) {
    return json(
      { ok: false, error: "supabase_env_missing (SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY)" },
      { status: 500 }
    )
  }

  // --- 受信JSON ---
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, { status: 400 })
  }

  if (!body?.code || !body?.type_label) {
    return json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 })
  }

  // ---- クイック診断の係数 ----
  const weight = 0.5

  // scores が無ければ code に該当する1点を加算
  const addOne = !body.scores
  const rawE = (body.scores?.E ?? 0) + (addOne && body.code === "E" ? 1 : 0)
  const rawV = (body.scores?.V ?? 0) + (addOne && body.code === "V" ? 1 : 0)
  const rawL = (body.scores?.["Λ"] ?? 0) + (addOne && body.code === "Λ" ? 1 : 0)
  const rawR = (body.scores?.["Ǝ"] ?? 0) + (addOne && body.code === "Ǝ" ? 1 : 0)

  const row = {
    user_id: body.user_id ?? null,
    type_label: body.type_label,
    comment: body.comment ?? null,
    e_score: rawE * weight,
    v_score: rawV * weight,
    lambda_score: rawL * weight,
    e_rev_score: rawR * weight,
  }

  const { data, error } = await sb
    .from("structure_results")
    .insert([row])
    .select()
    .single()

  if (error) {
    return json({ ok: false, error: error.message }, { status: 500 })
  }

  return json({ ok: true, record: data })
}
