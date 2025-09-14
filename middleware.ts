// middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ API は必ず素通り
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ✅ 認証交換とウェルカムも素通り
  if (pathname.startsWith("/auth/") || pathname === "/welcome") {
    return NextResponse.next();
  }

  // ✅ ここに保護したいページを追加していく
  // 例: 未ログインなら /mypage を守る
  // const hasSession = ... (supabase.auth などでチェック)
  // if (!hasSession && pathname.startsWith("/mypage")) {
  //   return NextResponse.redirect(new URL("/login", req.url));
  // }

  return NextResponse.next();
}

// この matcher は「どのパスに middleware を適用するか」
// /api は除外しているので、ここには保護したいページだけを書く
export const config = {
  matcher: ["/mypage/:path*", "/profile/result", "/daily/:path*"],
};
