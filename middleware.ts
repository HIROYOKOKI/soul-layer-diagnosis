// middleware.ts
import { NextResponse, type NextRequest } from "next/server";
// import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs";

export async function middleware(req: NextRequest) {
  // 認証なしモードにする（開発用）
  return NextResponse.next();
}
