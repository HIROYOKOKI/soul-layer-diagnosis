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
        { status: 200, headers: { "cache-control": "no-store" } }
      );
    }

    // 最新1件を取得（affirmation という列名でも拾えるよう alias を併用）
    const { data, error } = await sb
      .from("daily_results")
      .select(
        [
          "question_id",
          "slot",
          "mode",
          "scope",
          "code",
          "comment",
          "advice",           // 現行
          "guidance",         // 旧キー吸収用（存在しなくてもOK）
          "tip",              // 旧キー吸収用
          "affirm",           // 現行
          "affirmation",      // 旧キー
          "quote",            // 名言として保持している場合
          "score",
          "env",
          "created_at",
        ].join(",")
      )
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { ok: false, error: error.message },
        { status: 500, headers: { "cache-control": "no-store" } }
      );
    }

    // ---- 正規化（欠落キーの吸収）----
    const adviceNormalized =
      (data as any)?.advice ??
      (data as any)?.guidance ??
      (data as any)?.tip ??
      null;

    const affirmNormalized =
      (data as any)?.affirm ??
      (data as any)?.affirmation ??
      (data as any)?.quote ??
      null;

    const item = data
      ? {
          question_id: (data as any)?.question_id ?? null,
          slot: (data as any)?.slot ?? null,
          mode: (data as any)?.mode ?? (data as any)?.slot ?? null,
          // 互換のため theme と scope の両方を持たせる（UIはどちらかを参照）
          theme: (data as any)?.scope ?? null,
          scope: (data as any)?.scope ?? null,
          code: (data as any)?.code ?? null,
          comment: (data as any)?.comment ?? null,
          advice: adviceNormalized,              // ← 正規化済み
          affirm: affirmNormalized,              // ← 正規化済み
          affirmation: affirmNormalized,         // ← 互換プロパティ
          quote: (data as any)?.quote ?? null,
          score: (data as any)?.score ?? null,
          env: (data as any)?.env ?? null,
          created_at: (data as any)?.created_at ?? null,
          is_today_jst:
            (data as any)?.created_at
              ? toJstDateString((data as any).created_at) === toJstDateString(new Date())
              : false,
        }
      : null;

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
