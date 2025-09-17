// app/auth/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") || "/mypage";

  const supabase = createRouteHandlerClient({ cookies });

  if (code) {
    // セッション確立
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(
        new URL(`/login?reason=${encodeURIComponent(error.message)}`, url),
      );
    }

    // 👇 ここを追加：profiles に保険で upsert
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from("profiles")
        .insert({ id: user.id, email: user.email ?? null })
        .onConflict("id") // 既にある場合は何もしない
        .ignore();
    }
  }

  return NextResponse.redirect(new URL(next, url));
}
