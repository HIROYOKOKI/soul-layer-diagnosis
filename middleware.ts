// middleware.ts（開発中はこれでOK）
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(_req: NextRequest) {
  return NextResponse.next();
}
