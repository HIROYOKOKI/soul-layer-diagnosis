// middleware.ts （例）
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 公開APIの例外
  if (pathname === "/api/theme") return NextResponse.next();

  // ここから先が保護ロジック（例）
  // if (!req.cookies.get("sb:token")) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"], // 例
};
