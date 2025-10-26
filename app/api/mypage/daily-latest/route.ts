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

    // ※ DBに必ず存在する列だけを選ぶ（affirmationは選ばない）
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
          "quote",
          "score",
          "score_map",
          "env",
          "created_at",
        ].join(",")
      )
      .order("created_at", { ascending: false })
      .limit(1);

    if (envParam === "dev" || envParam === "prod") {
      query = query.eq("env", envParam);
    }
    if (themeParam) {
      query = query.eq("theme", themeParam);
    }

    const { data, error } = await query.maybeSingle();
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
    const adviceNormalized = data.advice ?? null;
    // DBに affirmation が無い環境向け：affirmation 互換キーを生成
    const affirmNormalized = data.affirm ?? data.quote ?? null;

    const item = {
      question_id: data.question_id ?? data.id ?? null,
      slot: data.slot ?? null,
      mode: data.slot ?? null, // UI互換
      scope: data.scope ?? null,
      theme: data.theme ?? data.scope ?? null,
      code: data.code ?? null,
      comment: data.comment ?? null,
      advice: adviceNormalized,
      affirm: affirmNormalized,           // 旧UI互換
      affirmation: affirmNormalized,      // 新UI互換
      quote: data.quote ?? null,
      score: data.score ?? null,
      score_map: data.score_map ?? null,
      env: data.env ?? null,
      created_at: data.created_at ?? null,
      is_today_jst: data.created_at
        ? toJstDateString(data.created_at) === toJstDateString(new Date())
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
