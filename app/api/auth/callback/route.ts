// app/api/auth/callback/route.ts
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

// OAuth / マジックリンク後のリダイレクトで呼ばれる（?code=…&next=/…）
export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/";

  try {
    if (code) {
      const supabase = createRouteHandlerClient({ cookies });
      await supabase.auth.exchangeCodeForSession(code); // ← Cookie確立
    }
    return NextResponse.redirect(new URL(next, origin));
  } catch (e: any) {
    console.error("auth.callback.GET.fail", { message: e?.message });
    // 失敗しても次画面へ戻す（未ログインのまま）
    return NextResponse.redirect(new URL(next, origin));
  }
}

// パスワードログイン/トークン更新/サインアウト時の Cookie 同期用
// 期待ボディ: { event: 'SIGNED_IN'|'TOKEN_REFRESHED'|'SIGNED_OUT', session?: any }
export async function POST(req: Request) {
  const supabase = createRouteHandlerClient({ cookies });

  try {
    const text = await req.text();
    const { event, session } =
      (text ? JSON.parse(text) : {}) as { event?: string; session?: any };

    if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
      if (!session) {
        return NextResponse.json({ ok: false, error: "missing_session" }, { status: 400 });
      }
      // ブラウザで取得したセッションをサーバーCookieへ反映
      await supabase.auth.setSession(session);
      return NextResponse.json({ ok: true, synced: true });
    }

    if (event === "SIGNED_OUT") {
      await supabase.auth.signOut();
      return NextResponse.json({ ok: true, signedOut: true });
    }

    // 想定外イベント
    return NextResponse.json({ ok: false, error: "invalid_event" }, { status: 400 });
  } catch (e: any) {
    console.error("auth.callback.POST.fail", { message: e?.message });
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
