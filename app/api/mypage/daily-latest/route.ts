// app/api/mypage/daily-latest/route.ts
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toJstDateString(d: string | Date) {
  const dt = new Date(d);
  return new Date(dt.toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" })).toDateString();
}

export async function GET(req: Request) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) {
      return NextResponse.json(
        { ok: false, error: "supabase_env_missing" },
        { status: 500, headers: { "cache-control": "no-store" } }
      );
    }

    const { searchParams } = new URL(req.url);
    const envParam = searchParams.get("env");     // 'dev' | 'prod' | null
    const themeParam = searchParams.get("theme"); // 任意

    // 取得カラムは互換重視で広めに
    let query = sb
      .from("daily_results")
      .select(
        [
          "id",
          "question_id",
          "user_id",
          "slot",
          "scope",
          "theme",
          "code",
          "comment",
          "advice",
          "affirm",
          "affirmation",
          "quote",
          "score",
          "score_map",
          "env",
          "created_at",
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (envParam === "dev" || envParam === "prod") {
      // @ts-expect-error: chain OK
      query = query.eq("env", envParam);
    }
    if (themeParam) {
      // @ts-expect-error: chain OK
      query = query.eq("theme", themeParam);
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

    // ---- 正規化（互換）----
    const any = data as Record<string, any>;
    const adviceNormalized = any.advice ?? null;
    const affirmNormalized = any.affirm ?? any.affirmation ?? any.quote ?? null;

    const item = {
      question_id: any.question_id ?? any.id ?? null,
      slot: any.slot ?? null,
      mode: any.slot ?? null, // UI互換
      scope: any.scope ?? null,
      theme: any.theme ?? any.scope ?? null,
      code: any.code ?? null,
      comment: any.comment ?? null,
      advice: adviceNormalized,
      affirm: affirmNormalized,
      quote: any.quote ?? null,
      score: any.score ?? null,
      score_map: any.score_map ?? null,
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
      { ok: false, error: String(e?.message ?? e) },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
