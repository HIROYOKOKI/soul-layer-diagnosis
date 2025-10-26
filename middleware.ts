// middleware.ts（プロジェクト直下）
import { NextResponse, type NextRequest } from "next/server";
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({
    req,
    res,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,      // ★直渡し
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, // ★直渡し
  });
  await supabase.auth.getSession();
  return res;
}
