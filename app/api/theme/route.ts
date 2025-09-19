// app/api/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Env = "dev" | "prod";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

const SCOPE_COOKIE = "sl_scope";
const EVS: EV[] = ["E", "V", "Λ", "Ǝ"];
const SCOPES: Scope[] = ["WORK", "LOVE", "FUTURE", "LIFE"];

// GET /api/theme?env=dev|prod
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: auth } = await supabase.auth.getUser();

  const envParam = new URL(req.url).searchParams.get("env");
  const env = ((envParam ?? "dev").toLowerCase() as Env) || "dev";

  // 1) scope は cookie から（未設定は LIFE）
  const c = cookies().get(SCOPE_COOKIE)?.value?.toUpperCase();
  const scope = (SCOPES as string[]).includes(c || "") ? (c as Scope) : "LIFE";

  // 2) EVΛƎテーマの最新（認証時のみ）
  if (!auth?.user) return NextResponse.json({ ok: true, scope, item: null });

  const { data, error } = await supabase
    .from("evae_theme_selected")
    .select("theme, env, created_at")
    .eq("user_id", auth.user.id)
    .eq("env", env)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, scope, item: data ?? null });
}

// POST /api/theme  { scope?:..., theme?:..., env?:..., reset?:boolean }
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const body = await req.json().catch(() => null) as {
    scope?: string; theme?: string; env?: Env; reset?: boolean;
  } | null;
  if (!body) return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });

  const env: Env = (body.env ?? "dev").toLowerCase() as Env;
  const reset = !!body.reset;

  let savedScope: Scope | undefined;
  let themeSaved = false;

  // 1) scope は cookie に保存（未ログインでもOK）
  if (body.scope) {
    const s = body.scope.toUpperCase();
    if (!(SCOPES as string[]).includes(s)) {
      return NextResponse.json({ ok: false, error: "invalid_scope" }, { status: 400 });
    }
    savedScope = s as Scope;
    cookies().set(SCOPE_COOKIE, savedScope, {
      path: "/",
      httpOnly: false,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 180,
    });
  }

  // 2) EVΛƎテーマ（E/V/Λ/Ǝ）は認証時のみDB保存（任意機能）
  if (body.theme) {
    const t = body.theme as EV;
    if (!EVS.includes(t)) return NextResponse.json({ ok: false, error: "invalid_theme" }, { status: 400 });
    const { data: auth } = await supabase.auth.getUser();
    if (!auth?.user) return NextResponse.json({ ok: false, error: "not_authenticated" }, { status: 401 });
    const { error } = await supabase.from("evae_theme_selected").insert({ user_id: auth.user.id, theme: t, env });
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    themeSaved = true;
  }

  return NextResponse.json({ ok: true, scope: savedScope, themeSaved, resetApplied: reset });
}
