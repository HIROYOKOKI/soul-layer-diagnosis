// app/api/theme/route.ts
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export type Scope = 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE';
const SCOPES: Scope[] = ['WORK', 'LOVE', 'FUTURE', 'LIFE'];
const SCOPE_COOKIE = 'sl_theme_scope'; // ← 統一

/** GET: 現在のテーマ（未設定は LIFE） */
export async function GET() {
  const jar = await cookies(); // 👈 await が必須
  const raw = jar.get(SCOPE_COOKIE)?.value?.toUpperCase();
  const scope: Scope = SCOPES.includes(raw as Scope) ? (raw as Scope) : 'LIFE';
  return NextResponse.json({ ok: true, scope });
}

// ★ここには POST を書かない（POST は /api/theme/set に分離）
