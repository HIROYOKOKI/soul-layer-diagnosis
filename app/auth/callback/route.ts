// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const next = url.searchParams.get("next") || "/welcome";

  // Supabase の 2系統のクエリに対応
  const code = url.searchParams.get("code");                 // Magic Link / PKCE
  const type = (url.searchParams.get("type") || "").toLowerCase(); // signup, magiclink, recovery...
  const token_hash = url.searchParams.get("token_hash");     // Confirm signup 等
  const token = url.searchParams.get("token");               // 稀に token で来るケース用

  const sb = createRouteHandlerClient({ cookies });

  try {
    if (code) {
      // ① PKCE / Magic Link
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (token_hash || token) {
      // ② Confirm signup / Recovery など（Email Templatesの {{ .ConfirmationURL }} 系）
      // type が来ていなければ signup とみなす
      const verifyType =
        (["signup", "magiclink", "recovery", "invite", "email_change"].includes(type)
          ? (type as any)
          : ("signup" as const));

      const { error } = await sb.auth.verifyOtp({
        type: verifyType,
        // Supabase v2 は token_hash 推奨。token しか無い場合のフォールバックも用意。
        token_hash: token_hash ?? undefined,
        token: token ?? undefined,
      } as any);
      if (error) throw error;
    } else {
      // どのトークンも無い
      return NextResponse.redirect(new URL("/login?e=noparams", url.origin), 303);
    }

    // セッション確立できた。導線は welcome へ
    return NextResponse.redirect(new URL(next, url.origin), 303);
  } catch (e: any) {
    const msg = e?.message || "auth_failed";
    return NextResponse.redirect(new URL(`/login?err=${encodeURIComponent(msg)}`, url.origin), 303);
  }
}
