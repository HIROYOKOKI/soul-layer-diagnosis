// app/api/mypage/daily-latest/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET() {
  try {
    const sb = createRouteHandlerClient({ cookies });
    const { data: { user }, error: userErr } = await sb.auth.getUser();
    if (userErr || !user) {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    // DBは scope カラム。フロントには theme として返す
    const { data, error } = await sb
      .from("daily_results")
      .select("slot, scope, code, comment, advice, affirm, score, created_at")
      .eq("user_id", user.id)                       // ★ 本人絞り込み
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      // 一時的に詳細エラーを返して原因を掴む（動いたら消してOK）
      return NextResponse.json({ ok: false, error: `postgrest: ${error.message}` }, { status: 500 });
    }

    const item = data
      ? {
          slot: data.slot,
          theme: data.scope, // ← 命名整合
          code: data.code,
          comment: data.comment,
          advice: data.advice,
          affirm: data.affirm,
          score: data.score,
          created_at: data.created_at,
        }
      : null;

    return NextResponse.json({ ok: true, item });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "internal" }, { status: 500 });
  }
}
