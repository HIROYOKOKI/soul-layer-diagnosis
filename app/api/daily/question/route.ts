// app/api/daily/question/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { getSlot } from "@/lib/daily";
import { buildQuestionFromData, fallbackQuestion } from "@/lib/question-gen";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const slot = getSlot();
  const noStore = { headers: { "cache-control": "no-store" } };

  let authedUser: { id: string } | null = null;
  let helperAuthErr: Error | null = null;

  try {
    // 1) Cookie 経由の認証（あるなら使う）
    const helper = createRouteHandlerClient({ cookies });
    const { data, error } = await helper.auth.getUser();
    helperAuthErr = (error as any) ?? null;
    authedUser = (data?.user as any) ?? null;

    // 2) Cookie が無ければ Bearer で補助（任意）
    if (!authedUser) {
      const auth = req.headers.get("authorization");
      const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
      if (token && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
        try {
          const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
          );
          const r = await sb.auth.getUser(token);
          authedUser = (r.data.user as any) ?? null;
        } catch (e) {
          // bearer 失敗は無視してゲストで続行
          console.error("daily.question.bearer.fail", (e as any)?.message);
        }
      }
    }

    // 3) 認証あり → 個別データを使って設問生成 / なし → ゲスト用（公開）
    if (authedUser) {
      // recent rows
      const { data: rows, error: rowsError } = await helper
        .from("daily_results")
        .select("code, scores, comment, created_at")
        .eq("user_id", authedUser.id)
        .eq("env", "prod")
        .order("created_at", { ascending: false })
        .limit(24);

      if (rowsError) {
        console.error("daily.question.rows.fail", {
          userId: authedUser.id,
          slot,
          message: rowsError.message,
        });
      }

      // theme（※カラム名は user_id。以前の id 指定はヒットしないので修正）
      const { data: profile, error: profileError } = await helper
        .from("profiles")
        .select("theme")
        .eq("user_id", authedUser.id) // ← 修正ポイント
        .maybeSingle();

      if (profileError) {
        console.error("daily.question.profile.fail", {
          userId: authedUser.id,
          slot,
          message: profileError.message,
        });
      }

      const theme = (profile as any)?.theme ?? undefined;
      const item = buildQuestionFromData(authedUser.id, slot, rows ?? [], theme);

      // 常に ok: true を付与（クライアント互換）
      return NextResponse.json({ ok: true, ...item, auth: "user" }, noStore);
    } else {
      // 未ログイン = 公開GET：ゲスト用の汎用設問を返す
      const item = fallbackQuestion(slot);
      return NextResponse.json({ ok: true, ...item, auth: "guest" }, noStore);
    }
  } catch (e: any) {
    // 例外時も UI を止めない（フォールバック返却）
    console.error("daily.question.fail", {
      slot,
      message: e?.message,
      helperAuthErr: helperAuthErr ? (helperAuthErr as any).message : null,
    });
    const item = fallbackQuestion(slot);
    return NextResponse.json({ ok: true, ...item, error: e?.message ?? "question_fallback" }, noStore);
  }
}
