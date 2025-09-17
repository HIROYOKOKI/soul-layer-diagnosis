import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.exchangeCodeForSession(); // ← これが cookie 設定

  const url = new URL(request.url);
  const next = url.searchParams.get("next") ?? "/mypage";
  return NextResponse.redirect(new URL(next, url.origin));
}
