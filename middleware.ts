// middleware.ts（安全版）
import { NextRequest, NextResponse } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const { pathname } = new URL(req.url);

  // API・静的はスキップ（ここで止めない）
  if (
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    /\.(ico|png|jpg|jpeg|svg|gif|webp|css|js|map)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const res = NextResponse.next();

  // env が無くても止めずに素通り
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnon) return res;

  try {
    const supabase = createMiddlewareClient({ req, res });
    // セッション更新だけ。失敗してもリダイレクトしない
    await supabase.auth.getSession();
  } catch {
    // noop
  }
  return res;
}

// 既存の matcher があればそのままでもOK（上で /api は除外済み）
// export const config = { matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"] };
