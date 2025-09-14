import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

type Slot = "morning" | "noon" | "night"

export async function POST(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })

  try {
    const body = await req.json()
    const {
      id,
      slot,
      env = "dev",
      theme = "dev",
      choice,             // optional（今は未使用）
      result,
    } = body || {}

    if (!id || !slot || !result?.code) {
      return NextResponse.json({ ok:false, error:"bad_request_missing_fields" }, { status:400 })
    }

    // 日付を id="daily-YYYY-MM-DD-<slot>" から抽出（列があれば保存用）
    const m = String(id).match(/^daily-(\d{4}-\d{2}-\d{2})-(morning|noon|night)$/)
    const day = m ? m[1] : null

    const payload: any = {
      id,               // ← これを UNIQUE または PRIMARY KEY にするのが前提（B を参照）
      slot,             // 'morning' | 'noon' | 'night'
      env,              // 'dev' | 'prod'
      theme,            // 'dev' | 'prod'
      code: result.code,
      comment: result.comment ?? null,
      quote: result.quote ?? null,
    }
    if (day) payload.day = day // もし daily_results に day 列があるなら使う

    // ★ 重要：
    // - id に UNIQUE か PK がある前提なら upsert でOK
    // - 無い場合は "ON CONFLICT specification requires a unique index" で落ちる
    const { data, error } = await sb
      .from("daily_results")
      .upsert(payload, { onConflict: "id" }) // ← 必ず衝突対象を明示
      .select("id")
      .maybeSingle()

    if (error) {
      // エラーをそのまま返す（切り分け用）
      return NextResponse.json({ ok:false, error: error.message }, { status:500 })
    }

    return NextResponse.json({ ok:true, id: data?.id ?? id })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error: e?.message ?? "internal_error" }, { status:500 })
  }
}
