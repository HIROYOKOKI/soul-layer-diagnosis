// app/api/theme/set/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Scope = 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE';
const SCOPES: Scope[] = ['WORK', 'LOVE', 'FUTURE', 'LIFE'];
const SCOPE_COOKIE = 'sl_theme_scope';

export async function POST(req: Request) {
  // JSON安全パース
  let body: any = {};
  try { body = await req.json(); } catch {}

  // リセット要求（記録の初期化トリガーが別である場合はそのAPIに委譲）
  if (body?.reset === true) {
    const res = NextResponse.json({ ok: true, resetApplied: true });
    res.cookies.set(SCOPE_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  }

  const raw = typeof body?.scope === 'string' ? body.scope.trim().toUpperCase() : '';
  if (!SCOPES.includes(raw as Scope)) {
    return NextResponse.json({ ok: false, error: 'invalid_scope' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, scope: raw });
  res.cookies.set(SCOPE_COOKIE, raw, {
    path: '/',
    httpOnly: true,                           // クライアントJSから触らない想定なら true 推奨
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 180,              // 180日
  });
  return res;
}
