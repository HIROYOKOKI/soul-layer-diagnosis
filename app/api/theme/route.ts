// app/api/theme/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

// 既存ファイルがある想定。置き換え or 追記でOK。
export async function GET(req: NextRequest) {
const supabase = createRouteHandlerClient({ cookies });
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ ok:false, error:"not_authenticated" }, { status: 401 });

// env=dev/prod をクエリから許可（デフォルトはdev）
const env = (new URL(req.url).searchParams.get("env") ?? "dev").toLowerCase();

const { data, error } = await supabase
.from("evae_theme_selected")
.select("theme, env, created_at")
.eq("user_id", user.id)
.eq("env", env)
.order("created_at", { ascending: false })
.limit(1)
.maybeSingle();

if (!user) {
  return NextResponse.json(
    { ok:false, error:"not_authenticated", hint:"/auth/callback を経由していないか、Cookieが付きませんでした" },
    { status: 401 }
  );
}

export async function POST(req: NextRequest) {
const supabase = createRouteHandlerClient({ cookies });
const { data: { user } } = await supabase.auth.getUser();
if (!user) return NextResponse.json({ ok:false, error:"not_authenticated" }, { status: 401 });

const body = await req.json().catch(() => null);
const theme = body?.theme as 'E'|'V'|'Λ'|'Ǝ' | undefined;
const env = (body?.env ?? 'dev') as 'dev'|'prod';
if (!theme || !['E','V','Λ','Ǝ'].includes(theme))
return NextResponse.json({ ok:false, error:"invalid_theme" }, { status: 400 });

const { error } = await supabase
.from("evae_theme_selected")
.insert({ user_id: user.id, theme, env });

if (error) return NextResponse.json({ ok:false, error: error.message }, { status: 500 });
return NextResponse.json({ ok:true });
}


