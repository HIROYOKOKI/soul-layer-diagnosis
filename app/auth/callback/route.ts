// app/auth/callback/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Next.js 15+: cookies() は await 必須
  const jar = await cookies();
  const supabase = createRouteHandlerClient({ cookies: () => jar });

  // クエリ取得
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/mypage";

  if (code) {
    // セッション交換
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // 失敗時はログインへ戻す（必要ならメッセージ付与）
      return NextResponse.redirect(new URL("/login?e=exchange_failed", url.origin));
    }
    // 成功時は next へ
    return NextResponse.redirect(new URL(next, url.origin));
  }

  // code が無い場合も next へ
  return NextResponse.redirect(new URL(next, url.origin));
}
