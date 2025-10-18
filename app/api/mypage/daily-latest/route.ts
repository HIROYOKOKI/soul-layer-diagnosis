// app/api/mypage/daily-latest/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toJstDateString(d: string | Date) {
  const dt = new Date(d);
  return new Date(dt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })).toDateString();
}

export async function GET(req: Request) {
  try {
    const sb = createRouteHandlerClient({ cookies });
    const {
      data: { user },
      error: userErr,
    } = await sb.auth.getUser();

    // 未ログイン → 空返し
    if (userErr || !user) {
      return NextResponse.json(
        { ok: true, item: null, unauthenticated: true },
        { status: 200, headers: { "cache-control": "no-store" } }
      );
    }

    const { searchParams } = new URL(req.url);
    const envParam = searchParams.get("env"); // dev | prod | null

    // ★ 実在カラムのみ明示 + idも取得して互換吸収
    let query = sb
      .from("daily_results")
      .select(
        [
          "id",            // ← 追加（旧ロジック互換）
          "question_id",   // （新ロジック）
          "user_id",
          "slot",
          "scope",
          "theme",
          "code",
          "comment",
          "advice",
          "affirm",
          "quote",
          "score",
          "env",
          "created_at",
        ].join(",")
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (envParam === "dev" || envParam === "prod") {
      // @ts-ignore chain ok
      query = query.eq("env", envParam);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: { "cache-control": "no-store" } }
      );
    }

    if (!data) {
      return NextResponse.json(
        { ok: true, item: null },
        { status: 200, headers: { "cache-control": "no-store" } }
      );
    }

    // ---- 正規化 ----
    const any = data as Record<string, any>;
    const adviceNormalized = any.advice ?? null;
    const affirmNormalized = any.affirm ?? any.affirmation ?? any.quote ?? null;

    const item = {
      question_id: any.question_id ?? any.id ?? null, // ← ここでidをフォールバック
      slot: any.slot ?? null,
      mode: any.slot ?? null,                         // UI互換
      scope: any.scope ?? null,
      theme: any.theme ?? any.scope ?? null,          // 互換（themeが無ければscope）
      code: any.code ?? null,
      comment: any.comment ?? null,
      advice: adviceNormalized,
      affirm: affirmNormalized,
      quote: any.quote ?? null,
      score: any.score ?? null,
      env: any.env ?? null,
      created_at: any.created_at ?? null,
      is_today_jst: any.created_at
        ? toJstDateString(any.created_at) === toJstDateString(new Date())
        : false,
    };

    return NextResponse.json(
      { ok: true, item },
      { status: 200, headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal_error" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
