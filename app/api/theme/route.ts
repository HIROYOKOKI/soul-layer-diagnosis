// app/api/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Env = "dev" | "prod";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

const EVS: EV[] = ["E", "V", "Λ", "Ǝ"];
const SCOPES: Scope[] = ["WORK", "LOVE", "FUTURE", "LIFE"];
const SCOPE_COOKIE = "sl_scope";

/* ======================
   GET /api/theme?env=dev|prod
   - 認証: なくてもOK（scopeは返す）
   - 戻り: { ok, scope, item? }  ※itemはEVΛƎテーマの最新1件
====================== */
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: auth } = await supabase.auth.getUser();
  const envParam = new URL(req.url).searchParams.get("env");
  const env = ((envParam ?? "dev").toLowerCase() as Env) || "dev";

  // 1) scope は cookie から（未指定は LIFE）
  const jar = cookies();
  const cookieScope = jar.get(SCOPE_COOKIE)?.value?.toUpperCase();
  const scope = (SCOPES as string[]).includes(cookieScope || "")
    ? (cookieScope as Scope)
    : "LIFE";

  // 2) EVΛƎ テーマ（履歴最新）は 認証があれば返す
  if (!auth?.user) {
    return NextResponse.json({
      ok: true,
      scope,
      item: null,
      hint: "not_authenticated",
    });
  }

  const { data, error } = await supabase
    .from("evae_theme_selected")
    .select("theme, env, created_at")
    .eq("user_id", auth.user.id)
    .eq("env", env)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, scope, item: data ?? null });
}

/* ======================
   POST /api/theme
   受け付けるbody:
   {
     scope?: "WORK"|"LOVE"|"FUTURE"|"LIFE",   // デイリーテーマ（未ログインOK・cookie保存）
     theme?: "E"|"V"|"Λ"|"Ǝ",                 // EVΛƎテーマ（ログイン必須・DB保存）
     env?: "dev"|"prod",                      // 既定: "dev"
     reset?: boolean                          // 変更時に保存リセットをフロント側でするかの合図
   }
   戻り: { ok, scope?, themeSaved?: true, resetApplied?: boolean }
====================== */
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const jar = cookies();

  const body = await req.json().catch(() => null) as {
    scope?: string;
    theme?: string;
    env?: Env;
    reset?: boolean;
  } | null;

  if (!body) {
    return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
  }

  const env: Env = (body.env ?? "dev").toLowerCase() as Env;
  const reset = !!body.reset;

  let savedScope: Scope | undefined;
  let themeSaved = false;

  // 1) scope（WORK/LOVE/FUTURE/LIFE）は cookie に保存（未ログインでもOK）
  if (body.scope) {
    const s = body.scope.toUpperCase();
    if (!SCOPES.includes(s as Scope)) {
      return NextResponse.json({ ok: false, error: "invalid_scope" }, { status: 400 });
    }
    savedScope = s as Scope;
    jar.set(SCOPE_COOKIE, savedScope, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 180, // 180日
    });
  }

  // 2) theme（E/V/Λ/Ǝ）は 認証必須でDBに履歴保存（これまで通り）
  if (body.theme) {
    const t = body.theme as EV;
    if (!EVS.includes(t)) {
      return NextResponse.json({ ok: false, error: "invalid_theme" }, { status: 400 });
    }

    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) {
      // scopeだけ変えたいケースがあるので、401でも scope は返す
      return NextResponse.json(
        { ok: false, error: "not_authenticated", scope: savedScope },
        { status: 401 },
      );
    }

    const { error } = await supabase
      .from("evae_theme_selected")
      .insert({ user_id: auth.user.id, theme: t, env });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }
    themeSaved = true;
  }

  return NextResponse.json({
    ok: true,
    scope: savedScope,     // 送ってきた場合のみ返す
    themeSaved,            // EVΛƎテーマを保存できたか
    resetApplied: reset,   // フロント側で「保存リセット」ダイアログ後処理の合図に使う
  });
}
