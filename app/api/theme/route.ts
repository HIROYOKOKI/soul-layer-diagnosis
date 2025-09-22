// app/api/theme/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type Scope = 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE';
const SCOPES: Scope[] = ['WORK', 'LOVE', 'FUTURE', 'LIFE'];
const SCOPE_COOKIE = 'sl_theme_scope'; // ← 統一

/** GET: 現在のテーマを返す（未設定なら LIFE） */
export async function GET() {
  const jar = await cookies(); // Next.js 15 は await 必須
  const raw = jar.get(SCOPE_COOKIE)?.value?.toUpperCase();
  const scope: Scope = SCOPES.includes(raw as Scope) ? (raw as Scope) : 'LIFE';
  return NextResponse.json({ ok: true, scope });
}
