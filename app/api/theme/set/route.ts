// app/api/theme/set/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Scope = 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE';
const SCOPES: Scope[] = ['WORK', 'LOVE', 'FUTURE', 'LIFE'];
const SCOPE_COOKIE = 'sl_theme_scope';

export async function POST(req: Request) {
  let body: any = {};
  try { body = await req.json(); } catch {}

  // リセット（必要なら使用）
  if (body?.reset === true) {
    const res = NextResponse.json({ ok: true, resetApplied: true });
    res.cookies.set(SCOPE_COOKIE, '', { path: '/', maxAge: 0 });
    return res;
  }

  // scope を受け付ける（theme ではない）
  const raw = typeof body?.scope === 'string' ? body.scope.trim().toUpperCase() : '';
  if (!SCOPES.includes(raw as Scope)) {
    return NextResponse.json({ ok: false, error: 'invalid_scope' }, { status: 400 });
  }

  const res = NextResponse.json({ ok: true, scope: raw });
  res.cookies.set(SCOPE_COOKIE, raw, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 60 * 60 * 24 * 180,
  });
  return res;
}
