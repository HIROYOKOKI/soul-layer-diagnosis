import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  try {
    const sb = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userErr } = await sb.auth.getUser();

    // ★ 未ログインなら 200 で空を返す（UIは「まだありません」を表示）
    if (userErr || !user) {
      return NextResponse.json({ ok: true, item: null, unauthenticated: true }, { status: 200 });
    }

    const { data, error } = await sb
      .from("daily_results")
      .select("slot, scope, code, comment, advice, affirm, score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    const item = data ? {
      slot: data.slot,
      theme: data.scope, // scope→theme に揃える
      code: data.code,
      comment: data.comment,
      advice: data.advice,
      affirm: data.affirm,
      score: data.score,
      created_at: data.created_at,
    } : null;

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "internal_error" }, { status: 500 });
  }
}
