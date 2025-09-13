// app/api/user/code/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 });

  // 認証ユーザーIDはフロントから送らず、サーバー側で verify する実装に寄せてもOK
  const { data: auth } = await sb.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return NextResponse.json({ ok:false, error:"unauthorized" }, { status:401 });

  // 既存コード取得
  const { data, error } = await sb.from("profiles")
    .select("user_code").eq("id", uid).maybeSingle();
  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 });

  if (data?.user_code) return NextResponse.json({ ok:true, userCode: data.user_code });

  // 未付与 → 生成（通し番号の作り方は運用に合わせて）
  // ここでは簡易にミリ秒下5桁を使用（本番は sequence 推奨）
  const seq = String(Date.now()).slice(-5);
  const userCode = `BEAJ-${seq}`;

  const { error: upErr } = await sb.from("profiles").upsert({ id: uid, user_code: userCode });
  if (upErr) return NextResponse.json({ ok:false, error: upErr.message }, { status:500 });

  return NextResponse.json({ ok:true, userCode });
}
