// app/api/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";
const SCOPES: Scope[] = ["WORK", "LOVE", "FUTURE", "LIFE"];
const SCOPE_COOKIE = "sl_scope";

/** POST: テーマを設定（WORK/LOVE/FUTURE/LIFE） */
export async function POST(req: NextRequest) {
  const body = (await req.json().catch(() => null)) as { scope?: string; reset?: boolean } | null;

  if (body?.reset) {
    // リセット要求：Cookie削除
    cookies().delete(SCOPE_COOKIE);
    return NextResponse.json({ ok: true, scope: "LIFE", resetApplied: true });
  }

  if (!body?.scope) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const scope = body.scope.toUpperCase() as Scope;
  if (!SCOPES.includes(scope)) {
    return NextResponse.json({ ok: false, error: "invalid_scope" }, { status: 400 });
  }

  // 本番は secure: true（Vercel/HTTPS前提）
  cookies().set({
    name: SCOPE_COOKIE,
    value: scope,
    path: "/",
    httpOnly: false,
    sameSite: "lax",
    secure: true,
    maxAge: 60 * 60 * 24 * 180, // 180日
  });

  return NextResponse.json({ ok: true, scope });
}

/** GET: 現在のテーマを返す（なければ LIFE） */
export async function GET() {
  const c = cookies().get(SCOPE_COOKIE)?.value?.toUpperCase();
  const scope: Scope = SCOPES.includes(c as Scope) ? (c as Scope) : "LIFE";
  return NextResponse.json({ ok: true, scope });
}
