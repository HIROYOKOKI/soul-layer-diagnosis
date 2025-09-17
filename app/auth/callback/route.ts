import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// 失敗しやすいので Node ランタイム & 動的に
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);

  const supabase = createRouteHandlerClient({
    cookies,
    // 明示指定（Vercelの本番Envが別プロジェクトだとここで発覚）
    // @ts-expect-error auth-helpers はこれらを受け取れます
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  const { error } = await supabase.auth.exchangeCodeForSession();

  // デバッグモード: /auth/callback?debug=1 で結果をその場表示
  if (url.searchParams.get("debug") === "1") {
    const { data: { user } } = await supabase.auth.getUser();
    return NextResponse.json({ ok: !error, error: error?.message ?? null, user });
  }

  if (error) {
    url.pathname = "/login";
    url.searchParams.set("error", error.message || "exchange_failed");
    return NextResponse.redirect(url);
  }

  const next = url.searchParams.get("next") || "/mypage";
  return NextResponse.redirect(new URL(next, url.origin));
}
