import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";
const SCOPES: Scope[] = ["WORK", "LOVE", "FUTURE", "LIFE"];
const SCOPE_COOKIE = "sl_theme_scope";

export async function GET() {
  const jar = await cookies(); // 👈 await 必須
  const raw = jar.get(SCOPE_COOKIE)?.value?.toUpperCase();
  const scope: Scope = SCOPES.includes(raw as Scope) ? (raw as Scope) : "LIFE";
  return NextResponse.json({ ok: true, scope });
}
