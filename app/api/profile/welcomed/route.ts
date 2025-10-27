// app/api/profile/welcomed/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  // 認証チェック（ユーザー取得）
  const sb = createRouteHandlerClient({ cookies });
  const { data: { user }, error: userErr } = await sb.auth.getUser();
  if (userErr || !user) {
    return NextResponse.json({ ok:false, error:"unauthenticated" }, { status:401 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 });
  }

  // 既にフラグ済みなら何もしない（冪等）
  const { data: prof } = await admin
    .from("profiles")
    .select("welcomed_at, welcome_done")
    .eq("id", user.id)
    .maybeSingle();

  if (prof?.welcomed_at || prof?.welcome_done === true) {
    return NextResponse.json({ ok:true, already:true });
  }

  // どちらか使っている方を更新
  const patch: any = {};
  // 時刻管理を採用している場合
  patch.welcomed_at = new Date().toISOString();
  // 真偽値管理を採用している場合（列が無ければ無視される）
  patch.welcome_done = true;

  const { error } = await admin.from("profiles").update(patch).eq("id", user.id);
  if (error) {
    return NextResponse.json({ ok:false, error: error.message }, { status:500 });
  }

  return NextResponse.json({ ok:true });
}
