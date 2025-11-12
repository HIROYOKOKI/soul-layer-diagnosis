// middleware.ts（デバッグ用の完全パススルー）
import { NextRequest, NextResponse } from "next/server";

export async function middleware(_req: NextRequest) {
  // 何もせず通す
  return NextResponse.next();
}

// ★ middleware自体を最小適用（あるいは削除と同等効果）
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
