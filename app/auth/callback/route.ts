// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  // メールテンプレから ?next=... を受け取ったら優先、無ければ /welcome へ
  const next = url.searchParams.get("next") || "/welcome";
  const code = url.searchParams.get("code");

  // Supabaseのセッション確立（これが無いと未ログインのまま）
  if (!code) {
    return NextResponse.redirect(new URL("/login?e=nocode", url.origin), 303);
  }

  const supabase = createRouteHandlerClient({ cookies });

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?err=${encodeURIComponent(error.message)}`, url.origin),
      303
    );
  }

  // ここから先の導線は /welcome で Theme → Profile … と制御
  return NextResponse.redirect(new URL(next, url.origin), 303);
}
