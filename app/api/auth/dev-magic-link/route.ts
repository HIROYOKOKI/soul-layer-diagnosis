// 開発用：メール送らずに Magic Link を発行して即リダイレクト
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSupabaseAdmin } from "@/lib/supabase-admin"; // service role client

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function makeOrigin(h: Headers) {
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = url.searchParams.get("email") || "";
  const next  = url.searchParams.get("next")  || "/welcome";
  const mode  = (url.searchParams.get("mode") || "magiclink").toLowerCase(); // magiclink | signup

  if (!email) {
    return NextResponse.json({ ok:false, error:"email_required" }, { status:400 });
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 });
  }

  const origin = makeOrigin(await headers());
  const redirectTo = `${origin}/auth/callback?next=${encodeURIComponent(next)}`;

  // まず既存ユーザー向けの magiclink を試す。無ければ signup にフォールバック。
  let actionLink: string | null = null;

  // A) 既存ユーザー向け
  if (mode === "magiclink") {
    const { data, error } = await (admin as any).auth.admin.generateLink({
      type: "magiclink",
      email,
      options: { redirectTo },
    });
    if (!error && data?.properties?.action_link) {
      actionLink = data.properties.action_link as string;
    }
  }

  // B) 新規作成（ユーザーが未登録だった場合）
  if (!actionLink) {
    const { data, error } = await (admin as any).auth.admin.generateLink({
      type: "signup",
      email,
      // 仮パスワード（不要だが型的に要求されることがある）
      password: crypto.randomUUID(),
      options: { redirectTo },
    });
    if (error) {
      return NextResponse.json({ ok:false, error: error.message }, { status:500 });
    }
    actionLink = data?.properties?.action_link as string;
  }

  // 取得できたリンクへ 303 でリダイレクト（/auth/callback → /welcome へ）
  return NextResponse.redirect(actionLink!, 303);
}
