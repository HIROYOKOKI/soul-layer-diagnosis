// app/auth/callback/route.ts
import { NextResponse, NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeNext(url: URL, raw: string | null): string {
  // 外部ドメイン禁止。絶対URLが来たら origin が一致する場合のみ採用
  if (!raw) return "/welcome";
  try {
    const n = new URL(raw, url.origin);
    if (n.origin !== url.origin) return "/welcome";
    // 常にパス＋検索＋ハッシュのみに正規化
    return `${n.pathname}${n.search}${n.hash}` || "/welcome";
  } catch {
    // 相対パスならそのまま（"/xxx"のみ許可）
    return raw.startsWith("/") ? raw : "/welcome";
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);

  // Supabase が付けてくる可能性のあるエラーを最初に処理
  const supaErr = url.searchParams.get("error") || url.searchParams.get("error_description");
  if (supaErr) {
    return NextResponse.redirect(new URL(`/login?err=${encodeURIComponent(supaErr)}`, url.origin), 303);
  }

  const next = safeNext(url, url.searchParams.get("next"));

  // Supabase の 2系統（code / token_hash|token）に対応
  const code = url.searchParams.get("code");                 // PKCE / Magic Link
  const token_hash = url.searchParams.get("token_hash");     // Confirm signup など
  const token = url.searchParams.get("token");               // 稀に token で来るケース
  const typeRaw = (url.searchParams.get("type") || "").toLowerCase();

  // 許可タイプのみ（不明なら signup にフォールバック）
  const allowed = new Set(["signup", "magiclink", "recovery", "invite", "email_change"]);
  const verifyType = (allowed.has(typeRaw) ? typeRaw : "signup") as
    | "signup" | "magiclink" | "recovery" | "invite" | "email_change";

  const sb = createRouteHandlerClient({ cookies });

  try {
    if (code) {
      // ① code フロー（推奨）
      const { error } = await sb.auth.exchangeCodeForSession(code);
      if (error) throw error;
    } else if (token_hash || token) {
      // ② token_hash / token フロー（テンプレの {{ .ConfirmationURL }} 等）
      const { error } = await sb.auth.verifyOtp({
        type: verifyType,
        token_hash: token_hash ?? undefined,
        token: token ?? undefined,
      } as any);
      if (error) throw error;
    } else {
      // どのトークンも無ければ無効
      return NextResponse.redirect(new URL("/login?e=noparams", url.origin), 303);
    }

    // セッション確立成功 → next（デフォルト /welcome）へ
    const res = NextResponse.redirect(new URL(next, url.origin), 303);
    res.headers.set("cache-control", "no-store");
    return res;
  } catch (e: any) {
    const msg = e?.message || "auth_failed";
    const res = NextResponse.redirect(new URL(`/login?err=${encodeURIComponent(msg)}`, url.origin), 303);
    res.headers.set("cache-control", "no-store");
    return res;
  }
}
