// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res }); // ← NEXT_PUBLIC_* が必要
  await supabase.auth.getSession(); // セッション更新
  return res;
}
