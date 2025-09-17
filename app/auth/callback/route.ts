import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const url = new URL(req.url);

  // 必要なら NEXT_PUBLIC_* を使って同一プロジェクトを明示（推奨）
  const supabase = createRouteHandlerClient({
    cookies,
    // @ts-expect-error: auth-helpers は Next 15 でもこのオプションを受けます
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  });

  const { error } = await supabase.auth.exchangeCodeForSession();

  if (error) {
    // エラー内容を可視化してデバッグしやすく
    url.pathname = "/login";
    url.searchParams.set("error", error.message || "exchange_failed");
    // 失敗時も一旦 next へ戻したいならここを /theme に変えてもOK
    return NextResponse.redirect(url);
  }

  const next = url.searchParams.get("next") || "/mypage";
  return NextResponse.redirect(new URL(next, url.origin));
}
