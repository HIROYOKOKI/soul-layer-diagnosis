// app/api/debug/latest/route.ts（想定）
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  const jar = await cookies();                                     // ★ await 必須
  const sb = createRouteHandlerClient({ cookies: () => jar });      // ★ 関数で渡す

  const { data: { user } } = await sb.auth.getUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const q = await sb
    .from("daily_results")
    .select("question_id, code, comment, quote, created_at, updated_at")
    .eq("user_id", user.id).eq("env", "prod")
    .order("updated_at", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return NextResponse.json({ ok: true, latest: q.data, error: q.error?.message ?? null });
}
