import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  // セッションを確認して、必要ならCookieを更新
  await supabase.auth.getSession();
  return res;
}

// _next や静的アセットを除外
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
