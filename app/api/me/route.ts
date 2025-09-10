// app/api/me/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

export async function GET() {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok: false, error: "supabase_env_missing" }, { status: 500 })

  // ここでは“とりあえず動かす”前提で先頭1件を返す
  const { data, error } = await sb
    .from("profiles")
    .select("*")
    .limit(1)
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  // 互換レスポンス（任意の表示があれば合わせてください）
  return NextResponse.json({
    ok: true,
    data,
    plan: String(data?.plan ?? "FREE").toUpperCase(),
    name: data?.name ?? "Hiro",
    id: String(data?.id ?? "0001"),
  })
}
