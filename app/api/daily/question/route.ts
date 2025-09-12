// app/api/daily/question/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from "@supabase/supabase-js";
import { getSlot } from "@/lib/daily";
import { buildQuestionFromData, fallbackQuestion } from "@/lib/question-gen";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  // --- 観測ログ（必要なら残す）
  // console.log("daily.question.check", {
  //   cookies: (await import("next/headers")).cookies().getAll().map(c => c.name),
  //   auth: req.headers.get("authorization")?.slice(0, 16) || null,
  // });

  // 1) Cookie（通常ルート）
  const helper = createRouteHandlerClient({ cookies });
  let { data: { user } } = await helper.auth.getUser();

  // 2) Cookieが無いときは Bearer を受ける（あなたのClientが送っている）
  if (!user) {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (token) {
      const sb = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const r = await sb.auth.getUser(token);
      user = r.data.user ?? null;
    }
  }

  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const slot = getSlot();

  try {
    // 3) 必要データは “ユーザーのRLSコンテキスト” で最小限取得
    const { data: rows } = await helper
      .from("daily_results")
      .select("code, scores, comment, created_at")
      .eq("user_id", user.id)
      .eq("env", "prod")
      .order("created_at", { ascending: false })
      .limit(24);

    const { data: profile } = await helper
      .from("profiles")
      .select("theme")
      .eq("id", user.id)
      .maybeSingle(); // ← .single()だと行が無いと例外、maybeSingleで安全

    const theme = (profile as any)?.theme ?? undefined;

    // 4) 純関数で質問を組み立て（SRK不要）
    const item = buildQuestionFromData(user.id, slot, rows ?? [], theme);

    return NextResponse.json(item);
  } catch (e: any) {
    console.error("daily.question.fail", {
      userId: user.id, slot, message: e?.message, stack: e?.stack
    });
    // 失敗してもUIは落とさない
    return NextResponse.json(fallbackQuestion(slot));
  }
}
