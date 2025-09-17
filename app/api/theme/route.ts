// app/api/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

type EV = "E" | "V" | "Λ" | "Ǝ";

// GET /api/theme?env=dev|prod ・・・最新1件を返す
export async function GET(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated", hint: "ログイン後に /auth/callback を経由してください" },
      { status: 401 },
    );
  }

  const envParam = new URL(req.url).searchParams.get("env");
  const env = (envParam ?? "dev").toLowerCase() as "dev" | "prod";

  const { data, error } = await supabase
    .from("evae_theme_selected")
    .select("theme, env, created_at")
    .eq("user_id", user.id)
    .eq("env", env)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, item: data ?? null });
}

// POST /api/theme ・・・{ theme:'E'|'V'|'Λ'|'Ǝ', env:'dev'|'prod' }
export async function POST(req: NextRequest) {
  const supabase = createRouteHandlerClient({ cookies });
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { ok: false, error: "not_authenticated", hint: "ログイン後に /auth/callback を経由してください" },
      { status: 401 },
    );
  }

  const body = await req.json().catch(() => null);
  const theme = body?.theme as EV | undefined;
  const env = (body?.env ?? "dev") as "dev" | "prod";

  if (!theme || !(["E", "V", "Λ", "Ǝ"] as EV[]).includes(theme)) {
    return NextResponse.json({ ok: false, error: "invalid_theme" }, { status: 400 });
  }

  const { error } = await supabase
    .from("evae_theme_selected")
    .insert({ user_id: user.id, theme, env });

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
