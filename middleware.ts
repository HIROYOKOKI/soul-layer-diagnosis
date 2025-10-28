// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export const config = {
  matcher: ["/mypage", "/api/mypage/:path*"], // 守りたいルート
};

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    const next = encodeURIComponent(req.nextUrl.pathname + req.nextUrl.search);
    // 例: /login?next=/mypage
    return NextResponse.redirect(new URL(`/login?next=${next}`, req.url));
  }
  return res;
}
