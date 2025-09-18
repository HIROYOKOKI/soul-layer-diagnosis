// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs"; // ← 重要：EdgeだとCookie確定が不安定

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/welcome?intro=1";

  if (!code) {
    return NextResponse.redirect(new URL("/login?e=no_code", url.origin));
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    return NextResponse.redirect(new URL("/login?e=callback_failed", url.origin));
  }

  // 成功：/welcomeへ
  return NextResponse.redirect(new URL(next, url.origin));
}
