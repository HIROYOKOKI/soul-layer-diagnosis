// middleware.ts（新規追加）
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  if (url.pathname.includes("//")) {
    url.pathname = url.pathname.replace(/\/{2,}/g, "/");
    return NextResponse.redirect(url, 308);
  }
  return NextResponse.next();
}

export const config = { matcher: ["/:path*"] };
