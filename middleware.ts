// middleware.ts（安全版B：スキップ条件を追加）
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // 下記は middleware をスキップ（APIの健全性確保）
  if (
    pathname.startsWith("/api/health") ||
    pathname.startsWith("/api/ping") ||
    pathname.startsWith("/api/today") ||
    pathname.startsWith("/api/daily/question") ||
    pathname.startsWith("/api/daily/generate") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|map)$/)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // env が無ければ素通り
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) return res;

  try {
    const supabase = createMiddlewareClient({ req, res });
    await supabase.auth.getSession();
  } catch {
    // 失敗しても止めない
  }
  return res;
}

// 何でも通す設定のままでもOK（上で除外しているため）
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
