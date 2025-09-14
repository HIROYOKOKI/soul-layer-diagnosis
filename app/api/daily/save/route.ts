import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

type Slot = "morning" | "noon" | "night"

export async function POST(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })

  try {
    const body = await req.json()
    const {
      id,                 // ← 論理ID。DBのidではなく question_id に入れる
      slot,               // 'morning' | 'noon' | 'night'（列が無いなら無視OK）
      env = "dev",
      theme = "dev",
      choice,             // 'E' | 'V' | 'Λ' | 'Ǝ'（列があるので入れておく）
      result,
    } = body || {}

    if (!id || !result?.code) {
      return NextResponse.json({ ok:false, error:"bad_request_missing_fields" }, { status:400 })
    }

    // 連想IDを question_id に保存。日付抽出は任意
    const dayMatch = String(id).match(/^daily-(\d{4}-\d{2}-\d{2})-/)
    const day = dayMatch ? dayMatch[1] : null

    const payload: any = {
      question_id: id,               // ← ここに論理ID
      env,                           // ← 必ず指定（DBデフォルトprodを避ける）
      theme,
      choice: choice ?? result.code,  // choice列あり
      code: result.code,
      comment: result.comment ?? null,
      quote: result.quote ?? null,
    }
    // slot列がテーブルに無いならこの2行は省いてOK
    if (slot) payload.mode = slot      // 既存の列に合わせるなら mode に入れておく
    if (day)  payload.created_at = new Date(`${day}T00:00:00Z`) // 任意（並び用に入れるなら）

    const { data, error } = await sb
      .from("daily_results")
      .insert(payload)
      .select("id, question_id")
      .maybeSingle()

    if (error) {
      return NextResponse.json({ ok:false, error: error.message }, { status:500 })
    }

    return NextResponse.json({ ok:true, id: data?.id, question_id: data?.question_id ?? id })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? "internal_error" }, { status:500 })
  }
}
