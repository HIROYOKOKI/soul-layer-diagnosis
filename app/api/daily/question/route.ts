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
  // --- 観測（必要なら残す）
  // console.log("daily.question.check", {
  //   cookieNames: cookies().getAll().map((c) => c.name),
  //   authHead: req.headers.get("authorization")?.slice(0, 16) ?? null,
  // });

  // 1) Cookie（通常ルート）
  const helper = createRouteHandlerClient({ cookies });
  let {
    data: { user },
    error: helperAuthErr,
  } = await helper.auth.getUser();

  // 2) Cookieが無いときは Bearer で補助
  if (!user) {
    const auth = req.headers.get("authorization");
    const token = auth?.startsWith("Bearer ") ? auth.slice(7) : undefined;
    if (token) {
      try {
        const sb = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        const r = await sb.auth.getUser(token);
        user = r.data.user ?? null;
      } catch (e: any) {
        console.error("daily.question.bearer.fail", { message: e?.message });
      }
    }
  }

  if (!user) {
    // 認証不在 → 401
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const slot = getSlot();

  // 3) データ取得（必ず try/catch で落とさない）
  try {
    // recent rows
    const { data: rows, error: rowsError } = await helper
      .from("daily_results")
      .select("code, scores, comment, created_at")
      .eq("user_id", user.id)
      .eq("env", "prod")
      .order("created_at", { ascending: false })
      .limit(24);

    if (rowsError) {
      console.error("daily.question.rows.fail", {
        userId: user.id,
        slot,
        message: rowsError.message,
      });
    }

    // theme
    const { data: profile, error: profileError } = await helper
      .from("profiles")
      .select("theme")
      .eq("id", user.id)
      .maybeSingle(); // 行なしでもOK

    if (profileError) {
      console.error("daily.question.profile.fail", {
        userId: user.id,
        slot,
        message: profileError.message,
      });
    }

    const theme = (profile as any)?.theme ?? undefined;

    // 4) 純関数で組み立て（失敗なし）
    const item = buildQuestionFromData(user.id, slot, rows ?? [], theme);
    return NextResponse.json(item);
  } catch (e: any) {
    // どこかで例外が出ても UI は維持
    console.error("daily.question.fail", {
      userId: user.id,
      slot,
      message: e?.message,
      stack: e?.stack,
      helperAuthErr: helperAuthErr?.message ?? null,
    });
    return NextResponse.json(fallbackQuestion(slot));
  }
}
