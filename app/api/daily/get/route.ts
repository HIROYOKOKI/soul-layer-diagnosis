import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "../../../../lib/supabase-admin";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id");  // 例: 1d:001
  if (!id) return NextResponse.json({ ok:false, error:"id_required" }, { status:400 });

  const sb = getSupabaseAdmin();
  if (!sb) return NextResponse.json({ ok:false, error:"supabase_env_missing" }, { status:500 });

  // どの列で管理しているかに合わせて one of:
  //   .eq("result_id", id)  /  .eq("question_id", id)  /  .eq("external_id", id)
  const { data, error } = await sb
    .from("daily_results")
    .select("code, comment, advice, affirm, score, evla, slot, theme, created_at")
    .eq("question_id", id)
    .limit(1)
    .maybeSingle();

  if (error) return NextResponse.json({ ok:false, error:error.message }, { status:500 });
  return NextResponse.json({ ok:true, item: data ?? null });
}
