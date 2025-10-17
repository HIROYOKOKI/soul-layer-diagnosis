// app/api/mypage/daily-latest/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toJstDateString(d: string | Date) {
  const dt = new Date(d);
  return new Date(
    dt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })
  ).toDateString();
}

export async function GET() {
  try {
    const sb = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userErr,
    } = await sb.auth.getUser();

    // 未ログインは空返し（UI側で「まだ診断がありません」表示）
    if (userErr || !user) {
      return NextResponse.json(
        { ok: true, item: null, unauthenticated: true },
        { status: 200 }
      );
    }

    // 最新1件
    const { data, error } = await sb
      .from("daily_results")
      .select(
        // 必要に応じて列名を合わせてください（例：affirmation列なら affirm:affirmation に）
        "slot, scope, code, comment, advice, affirm, quote, score, created_at"
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500 }
      );
    }

    const item = data
      ? {
          slot: data.slot,
          theme: data.scope,               // scope → theme に統一
          code: data.code,
          comment: data.comment,
          advice: data.advice,
          quote: data.quote ?? null,
          affirm: data.affirm ?? null,     // DBが affirmation なら: data.affirmation
          affirmation: data.affirm ?? null, // 互換プロパティを併記
          score: data.score ?? null,
          created_at: data.created_at,
          is_today_jst:
            toJstDateString(data.created_at) ===
            toJstDateString(new Date()),
        }
      : null;

    return NextResponse.json({ ok: true, item }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal_error" },
      { status: 500 }
    );
  }
}
