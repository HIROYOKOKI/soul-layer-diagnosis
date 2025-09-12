// app/api/auth/callback/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    await supabase.auth.exchangeCodeForSession(code); // OAuth/メールリンク → Cookie確立
  }
  return NextResponse.redirect(new URL(next, origin));
}

// ← これが重要：パスワードログインや signOut 時に Cookie を同期する
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const { event, session } = await req.json(); // { event: 'SIGNED_IN'|'TOKEN_REFRESHED'|'SIGNED_OUT', session }
  if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
    await supabase.auth.setSession(session);
  }
  if (event === "SIGNED_OUT") {
    await supabase.auth.signOut();
  }
  return NextResponse.json({ ok: true });
}
