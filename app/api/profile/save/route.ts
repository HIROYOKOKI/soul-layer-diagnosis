// app/api/profile/save/route.ts （差分）
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function POST(req: Request) {
  try {
    const sb = getSupabaseAdmin()
    if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })

    const body = await req.json()
    const { user_id = null } = body

    // ★ 一度きりガード（user_id 必須推奨）
    if (user_id) {
      const { data: exists, error: qerr } = await sb
        .from("profile_results")
        .select("id")
        .eq("user_id", user_id)
        .limit(1)
        .maybeSingle()
      if (qerr) return NextResponse.json({ ok:false, error:qerr.message }, { status:500 })
      if (exists) {
        return NextResponse.json({ ok:false, error:"already_exists", code:"PROFILE_RESULT_EXISTS" }, { status:409 })
      }
    }

    const row = {
      user_id: user_id,
      fortune: body.fortune ?? null,
      personality: body.personality ?? null,
      partner: body.partner ?? null,
      base_model: body.base_model ?? null,
      base_order: body.base_order ?? null,
      base_points: body.base_points ?? null,
    }

    const { data, error } = await sb
      .from("profile_results")
      .insert([row])
      .select("id, created_at, base_model")
      .maybeSingle()

    if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
    return NextResponse.json({ ok:true, id:data?.id, created_at:data?.created_at, base_model:data?.base_model })
  } catch (e:any) {
    return NextResponse.json({ ok:false, error:String(e?.message ?? e) }, { status:500 })
  }
}
