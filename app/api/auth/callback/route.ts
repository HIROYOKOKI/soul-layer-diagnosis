import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * OAuth / Magic link 用（GET）
 */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code);
  }

  return NextResponse.redirect(new URL(next, url.origin));
}

/**
 * Email/Password 用（POST）
 * 👉 ここで Cookie が作られる
 */
export async function POST(req: Request) {
  const { session } = await req.json();

  if (!session) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const supabase = createRouteHandlerClient({ cookies });
  await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  });

  return NextResponse.json({ ok: true });
}
