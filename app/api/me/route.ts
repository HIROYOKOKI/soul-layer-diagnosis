// app/api/me/route.ts
import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"

export async function GET() {
  const supabase = createRouteHandlerClient({ cookies })

  // 認証ユーザーを取得
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError || !user) {
    return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 })
  }

  // profiles から本人のレコードを取得
  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, id_no, id_no_str, name, plan")
    .eq("id", user.id) // 👈 本人だけ
    .maybeSingle()

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    id: user.id,                          // 内部 UUID
    idNo: data?.id_no ?? null,            // 連番
    idNoStr: data?.id_no_str ?? null,     // 表示用 0001 形式
    email: data?.email ?? user.email,     // email（保険で auth.users からも）
    name: data?.name ?? null,
    plan: String(data?.plan ?? "FREE").toUpperCase(),
  })
}
