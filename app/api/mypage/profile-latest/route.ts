// app/api/mypage/profile-latest/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "../../../../lib/supabase-admin"

type EV = "E" | "V" | "Λ" | "Ǝ"
type Model = "EΛVƎ" | "EVΛƎ"

export async function GET() {
  const sb = getSupabaseAdmin()
  if (!sb) {
    return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 })
  }

  // base_order_v2(jsonb) を優先、旧 base_order(text/array) も取得
  const { data, error } = await sb
    .from("profile_results")
    .select(`
      fortune,
      personality,
      partner,
      base_model,
      base_points,
      base_order,
      base_order_v2,
      created_at
    `)
    .order("created_at", { ascending:false })
    .limit(1)
    .maybeSingle()

  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 })
  if (!data) return NextResponse.json({ ok:true, item:null })

  const okVals = ["E","V","Λ","Ǝ"] as const
  const normOrder = (input: unknown): EV[] | null => {
    if (Array.isArray(input)) {
      const arr = (input as unknown[]).map(String).filter(v => (okVals as readonly string[]).includes(v)) as EV[]
      return arr.length ? arr : null
    }
    if (input == null) return null
    const parts = String(input).split(/[\s,\-]+/).map(s=>s.trim()).filter(Boolean)
    const arr = parts.filter(v => (okVals as readonly string[]).includes(v)) as EV[]
    return arr.length ? arr : null
  }

  const item = {
    fortune: data.fortune ?? null,
    personality: data.personality ?? null,
    partner: data.partner ?? null,
    base_model: (data.base_model === "EΛVƎ" || data.base_model === "EVΛƎ") ? data.base_model as Model : null,
    base_order: normOrder((data as any).base_order_v2 ?? (data as any).base_order), // ← EV[] に統一
    created_at: data.created_at ?? null,
  }

  return NextResponse.json({ ok:true, item })
}
