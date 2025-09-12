import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const dynamic = "force-dynamic";
export async function GET() {
  const sb = createRouteHandlerClient({ cookies });
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return NextResponse.json({ ok:false, error:"unauthorized" }, { status:401 });

  const q = await sb.from("daily_results")
    .select("question_id, code, comment, quote, created_at, updated_at")
    .eq("user_id", user.id).eq("env","prod")
    .order("updated_at", { ascending:false })
    .order("created_at", { ascending:false })
    .limit(1).maybeSingle();

  return NextResponse.json({ ok:true, latest:q.data, error:q.error?.message ?? null });
}
