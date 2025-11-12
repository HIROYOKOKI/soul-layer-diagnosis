// middleware.ts（安全版A：限定マッチ）
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  // 必要なenvが無いときは Supabase 初期化をスキップ（素通り）
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) return res;

  try {
    const supabase = createMiddlewareClient({ req, res });
    await supabase.auth.getSession(); // セッション更新だけ
  } catch {
    // 失敗してもAPIを止めず素通り
  }
  return res;
}

// ★ 認証が必要なページだけに絞る
export const config = {
  matcher: [
    "/mypage/:path*",
    "/settings/:path*",
    "/profile/result/:path*",
    // 必要に応じて追加
  ],
};
