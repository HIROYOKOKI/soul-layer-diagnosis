import { getSupabaseAdmin } from "@/lib/supabase-admin"
import { getSupabaseServer } from "@/lib/supabaseServer"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type EVChar = "E" | "V" | "Λ" | "Ǝ"
type Body = {
  code: EVChar
  type_label: string
  comment?: string
  scores?: Partial<Record<EVChar, number>>
  // user_id?: string | null   ← 外部からは受け取らない（サーバで決定）
}

function json(data: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(data), {
    status: init?.status ?? 200,
    headers: { "content-type": "application/json; charset=utf-8" },
  })
}

export async function POST(req: Request): Promise<Response> {
  // 1) ログイン中ユーザーを取得（クッキーから）
  let uid: string | null = null
  try {
    const sv = getSupabaseServer()
    const { data, error } = await sv.auth.getUser()
    if (error) throw error
    uid = data.user?.id ?? null
  } catch {
    // ここで落とす（紐付け必須仕様）
    return json({ ok: false, error: "unauthorized" }, { status: 401 })
  }
  if (!uid) return json({ ok: false, error: "unauthorized" }, { status: 401 })

  // 2) Adminクライアント
  const sb = getSupabaseAdmin()
  if (!sb) return json({ ok: false, error: "supabase_env_missing" }, { status: 500 })

  // 3) 入力JSON
  let body: Body
  try {
    body = (await req.json()) as Body
  } catch {
    return json({ ok: false, error: "INVALID_JSON" }, { status: 400 })
  }
  if (!body?.code || !body?.type_label) {
    return json({ ok: false, error: "INVALID_PAYLOAD" }, { status: 400 })
  }

  // 4) スコア計算
  const weight = 0.5
  const addOne = !body.scores
  const rawE = (body.scores?.E ?? 0) + (addOne && body.code === "E" ? 1 : 0)
  const rawV = (body.scores?.V ?? 0) + (addOne && body.code === "V" ? 1 : 0)
  const rawL = (body.scores?.["Λ"] ?? 0) + (addOne && body.code === "Λ" ? 1 : 0)
  const rawR = (body.scores?.["Ǝ"] ?? 0) + (addOne && body.code === "Ǝ" ? 1 : 0)

  const row = {
    user_id: uid,                 // ★ ここをサーバで決め打ち
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

  if (error) return json({ ok: false, error: error.message }, { status: 500 })
  return json({ ok: true, record: data })
}
