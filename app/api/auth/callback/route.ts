import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/";

  if (code) {
    const supabase = createRouteHandlerClient({ cookies });
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // 失敗時はログインへ戻す（必要ならエラーパラメータも付けられる）
      return NextResponse.redirect(new URL(`/login?e=callback`, url.origin));
    }
  }

  return NextResponse.redirect(new URL(next, url.origin));
}
