// app/api/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";
const SCOPES: Scope[] = ["WORK","LOVE","FUTURE","LIFE"];
const SCOPE_COOKIE = "sl_scope";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null) as { scope?: string; reset?: boolean } | null;
  if (!body?.scope) return NextResponse.json({ ok:false, error:"bad_request" }, { status:400 });

  const scope = body.scope.toUpperCase();
  if (!SCOPES.includes(scope as Scope)) {
    return NextResponse.json({ ok:false, error:"invalid_scope" }, { status:400 });
  }

  // ★ ここが重要：本番は secure: true で保存
  cookies().set({
    name: SCOPE_COOKIE,
    value: scope,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: true,               // ← 必須（Vercel/HTTPS）
    maxAge: 60 * 60 * 24 * 180, // 180日
  });

  return NextResponse.json({ ok:true, scope, resetApplied: !!body.reset });
}

export async function GET() {
  const c = cookies().get(SCOPE_COOKIE)?.value?.toUpperCase();
  const scope = (SCOPES as string[]).includes(c || "") ? (c as Scope) : "LIFE";
  return NextResponse.json({ ok:true, scope, item: null /* EVΛƎテーマは省略 */ });
}
