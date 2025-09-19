// app/api/mypage/daily-latest/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Env = "dev" | "prod";

export async function GET(req: NextRequest) {
  const sb = getSupabaseAdmin();
  if (!sb) {
    return NextResponse.json({ ok: false, error: "supabase_env_missing" }, { status: 500 });
  }

  try {
    const envParam = req.nextUrl.searchParams.get("env");
    const env = ((envParam ?? "dev").toLowerCase() as Env) || "dev";

    const { data, error } = await sb
      .from("daily_results")
      // ★ scope と mode と env を含めて返す
      .select("code, comment, advice, quote, scope, mode, env, created_at, question_id")
      .eq("env", env)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: data ?? null });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "internal_error" }, { status: 500 });
  }
}
