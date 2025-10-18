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
    const { data: { user }, error: userErr } = await sb.auth.getUser();

    // 未ログインは空返し（UI側で「まだ診断がありません」表示）
    if (userErr || !user) {
      return NextResponse.json(
        { ok: true, item: null, unauthenticated: true },
        { status: 200, headers: { "cache-control": "no-store" } }
      );
    }

    // 最新1件
    const { data, error } = await sb
      .from("daily_results")
      .select(
        // ※ DBの列が "affirmation" の場合は「affirm:affirmation」に書き換えてください
        "slot, scope, code, comment, advice, affirm, quote, score, created_at"
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

    const affirmNormalized =
      (data as any)?.affirm ??
      (data as any)?.affirmation ??   // 列名が affirmation のプロジェクト向け
      (data as any)?.quote ??         // 名言をアファメとして使っていた旧実装向け
      null;

    const item = data
      ? {
          slot: data.slot ?? null,
          // 互換のため theme と scope の両方を持たせる（UIはどちらかを参照）
          theme: data.scope ?? null,
          scope: data.scope ?? null,
          code: data.code ?? null,
          comment: data.comment ?? null,
          advice: data.advice ?? null,
          quote: (data as any)?.quote ?? null,
          affirm: affirmNormalized,                 // ← 正規化済み
          affirmation: affirmNormalized,            // ← 互換プロパティ
          score: data.score ?? null,
          created_at: data.created_at ?? null,
          is_today_jst:
            data?.created_at
              ? toJstDateString(data.created_at) === toJstDateString(new Date())
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
