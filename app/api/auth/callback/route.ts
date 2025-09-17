import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// クッキー同期用エンドポイント（auth-helpers が自動POSTする）
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies });
  // セッションを読ませることで Set-Cookie を発行させる
  await supabase.auth.getSession();
  return NextResponse.json({ ok: true });
}

// （任意）プリフライト対策・デバッグ用
export async function GET() {
  return NextResponse.json({ ok: true });
}
