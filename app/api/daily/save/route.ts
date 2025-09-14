// app/api/daily/save/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

type Slot = "morning" | "noon" | "night"

export async function POST(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })

  try {
    const body = await req.json()
    const {
      id,       // 論理ID = daily-YYYY-MM-DD-<slot>
      slot,
      env = "dev",
      theme = "dev",
      choice,
      result,
      user_id,  // 将来使うなら
    } = body || {}

    if (!id || !result?.code) {
      return NextResponse.json({ ok:false, error:"bad_request_missing_fields" }, { status:400 })
    }

    const payload: any = {
      question_id: id,
      env,
      theme,
      choice: choice ?? result.code,
      code: result.code,
      comment: result.comment ?? null,
      quote: result.quote ?? null,
    }
    if (user_id) payload.user_id = user_id
    if (slot) payload.slot = slot

    // ← upsert に変更
    const { data, error } = await sb
      .from("daily_results")
      .upsert(payload, { onConflict: "question_id" }) // ★ここでユニークキーと揃える
      .select("id, question_id")
      .maybeSingle()

    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })

    return NextResponse.json({ ok:true, id: data?.id, question_id: data?.question_id ?? id })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? "internal_error" }, { status:500 })
  }
}
