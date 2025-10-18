// app/api/daily/diagnose/route.ts
import { NextResponse } from "next/server";
import { cookies as headerCookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ……（型・ユーティリティ・FB・genWithAI はそのまま）……

export async function POST(req: Request) {
  // どこで失敗したかを追えるように段階名を持つ
  let stage: "parse"|"gen"|"save"|"respond" = "parse";

  try {
    const raw = (await req.json()) as Partial<Body>;

    // --- 入力正規化 ---
    let id: string, slot: Slot, choice: EV, scope: Scope;
    const isLegacy = typeof raw?.seed !== "undefined" || typeof raw?.choiceId !== "undefined";

    if (isLegacy) {
      const c = headerCookies();
      const cookieSlot = c.get("daily_slot")?.value as Slot | undefined;
      const cookieTheme = (c.get("daily_theme")?.value as Scope | undefined) || "LIFE";
      slot = (cookieSlot ?? getJstSlot()) as Slot;
      const jst = new Date(Date.now() + 9 * 3600 * 1000);
      id = `daily-${jst.getUTCFullYear()}-${String(jst.getUTCMonth()+1).padStart(2,"0")}-${String(jst.getUTCDate()).padStart(2,"0")}-${slot}`;
      choice = String(raw?.choiceId ?? "").toUpperCase() as EV;
      scope = (String((raw as any)?.theme ?? cookieTheme ?? "LIFE").toUpperCase()) as Scope;
    } else {
      if (!raw?.id || !raw?.slot || !raw?.choice) {
        return NextResponse.json({ ok:false, stage, error:"bad_request_missing_fields" }, { status:200 });
      }
      id = raw.id; slot = raw.slot; choice = raw.choice;
      scope = (String(raw.scope ?? "LIFE").toUpperCase() as Scope);
    }

    const env = (raw?.env ?? "prod") as "dev" | "prod";
    const themeTag = (raw?.theme ?? "prod") as "dev" | "prod";
    const client_ts = raw?.ts ?? null;

    // --- 生成 ---
    stage = "gen";
    let comment: string | null = null, advice: string | null = null, affirm: string | null = null;
    try {
      const ai = await genWithAI(choice, slot, scope);
      comment = ai.comment; advice = ai.advice; affirm = ai.affirm;
    } catch (e: any) {
      // 生成失敗でもフォールバックで続行
      console.error("AI生成エラー:", e?.message ?? e);
    }
    if (!comment) comment = FB_COMMENT[choice];
    if (!advice) advice = FB_ADVICE[choice];
    if (!affirm) affirm = FB_AFFIRM[choice];

    // --- 保存 ---
    stage = "save";
    const created_at = new Date().toISOString();
    let save_error: any = null;
    try {
      const sb = getSupabaseAdmin();
      if (!sb) throw new Error("supabase_env_missing");

      // ログインユーザーIDを取得（未ログインは null で匿名保存）
      let user_id: string | null = null;
      try {
        const auth = createRouteHandlerClient({ cookies: headerCookies });
        const { data } = await auth.auth.getUser();
        user_id = data?.user?.id ?? null;
      } catch { /* noop */ }

      const payload = {
        question_id: id,
        user_id,
        slot,
        scope,
        code: choice,
        comment,
        advice,
        affirm,
        score: 0.3,
        created_at,
        env,
        theme: themeTag,
        client_ts,
      };

      // 複合ユニーク (user_id,question_id,env) を想定
      const { error } = await sb
        .from("daily_results")
        .upsert(payload, { onConflict: "user_id,question_id,env" });
      if (error) throw error;
    } catch (e: any) {
      console.error("保存エラー:", e);
      save_error = {
        message: e?.message ?? "save_failed",
        details: e?.details ?? null,
        hint: e?.hint ?? null,
        code: e?.code ?? null,
      };
      // ここでは落とさず続行（UIへ message を返す）
    }

    // --- レスポンス ---
    stage = "respond";
    const item = { question_id:id, slot, scope, code:choice, comment, advice, affirm, score:0.3, created_at, env };
    return NextResponse.json(
      { ok:true, item, comment, advice, affirm, score:0.3, save_error },
      { status:200, headers:{ "cache-control":"no-store" } }
    );

  } catch (e: any) {
    console.error("診断API失敗(stage="+stage+"):", e);
    // ここも 200 で返す（UIが内容を出せるように）
    return NextResponse.json(
      { ok:false, stage, error: e?.message ?? "internal_error" },
      { status:200, headers:{ "cache-control":"no-store" } }
    );
  }
}
