// app/api/admin/users/create/route.ts
import { NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase-admin"

type Body = {
  email: string
  password: string
  display_name?: string
  member_code?: string
  theme?: string
}

export async function POST(req: Request) {
  const sb = getSupabaseAdmin()
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status: 500 })

  const body = (await req.json()) as Body
  const { email, password } = body
  if (!email || !password) {
    return NextResponse.json({ ok:false, error:"email_password_required" }, { status: 400 })
  }

  // 2-1) 確認済みでユーザー作成
  const { data: created, error: createErr } = await sb.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: body.display_name ?? "",
      member_code: body.member_code ?? "",
    },
  })
  if (createErr || !created?.user) {
    return NextResponse.json({ ok:false, error: createErr?.message ?? "create_failed" }, { status: 500 })
  }

  const user = created.user
  const theme = body.theme ?? "self"

  // 2-2) profiles に upsert
  const { data: prof, error: profErr } = await sb
    .from("profiles")
    .upsert({
      id: user.id,
      display_name: (user.user_metadata as any)?.display_name ?? "",
      member_code: (user.user_metadata as any)?.member_code ?? "",
      theme,
    }, { onConflict: "id" })
    .select()
    .maybeSingle()

  if (profErr) {
    return NextResponse.json({ ok:false, error: profErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    user: { id: user.id, email: user.email, confirmed_at: user.email_confirmed_at },
    profile: prof,
  })
}
