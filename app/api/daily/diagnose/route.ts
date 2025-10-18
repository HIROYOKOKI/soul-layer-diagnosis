// app/api/daily/diagnose/route.ts
import { NextResponse } from "next/server";
import { cookies as headerCookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ===== ここまでの型/ユーティリティ/FB/genWithAI は既存のまま ===== */

export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as Partial<Body>;
    const isLegacy = typeof raw?.seed !== "undefined" || typeof raw?.choiceId !== "undefined";

    // 入力正規化
    let id: string; // ← question_id として使う
    let slot: Slot;
    let choice: EV;
    let scope: Scope;

    if (isLegacy) {
      const c = headerCookies();
      const cookieSlot = c.get("daily_slot")?.value as Slot | undefined;
      const cookieTheme = (c.get("daily_theme")?.value as Scope | undefined) || "LIFE";
      slot = (cookieSlot ?? getJstSlot()) as Slot;
      const jst = new Date(Date.now() + 9 * 3600 * 1000);
      id = `daily-${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}-${String(jst.getUTCDate()).padStart(2, "0")}-${slot}`;
      choice = String(raw?.choiceId ?? "").toUpperCase() as EV;
      scope = (String((raw as any)?.theme ?? cookieTheme ?? "LIFE").toUpperCase()) as Scope;
    } else {
      if (!raw?.id || !raw?.slot || !raw?.choice) {
        return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
      }
      id = raw.id;
      slot = raw.slot;
      choice = raw.choice;
      scope = (String(raw.scope ?? "LIFE").toUpperCase() as Scope);
    }

    const env = (raw?.env ?? "prod") as "dev" | "prod";
    const themeTag = (raw?.theme ?? "prod") as "dev" | "prod";
    const client_ts = raw?.ts ?? null;

    // === 生成 ===
    let comment: string | null = null;
    let advice: string | null = null;
    let affirm: string | null = null;
    try {
      const ai = await genWithAI(choice, slot, scope);
      comment = ai.comment;
      advice = ai.advice;
      affirm = ai.affirm;
    } catch (e: any) {
      console.error("AI生成エラー:", e?.message ?? e);
    }

    // フォールバック
    if (!comment) comment = FB_COMMENT[choice];
    if (!advice) advice = FB_ADVICE[choice];
    if (!affirm) affirm = FB_AFFIRM[choice];

    // === 保存 ===
    const created_at = new Date().toISOString();
    let save_error: string | null = null;
    try {
      const sb = getSupabaseAdmin();
      if (!sb) throw new Error("supabase_env_missing");

      // ログインユーザーID取得（未ログインは null で匿名保存）
      let user_id: string | null = null;
      try {
        const auth = createRouteHandlerClient({ cookies: headerCookies });
        const { data } = await auth.auth.getUser();
        user_id = data?.user?.id ?? null;
      } catch { /* noop */ }

      // ★ PK衝突回避：idは送らない（DBに任せる）
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

      // ★ ユニークキーでUPSERT（duplicate回避）
      await sb
        .from("daily_results")
        .upsert(payload, { onConflict: "user_id,question_id,env" });
    } catch (e: any) {
      console.error("保存エラー:", e);
      save_error = e?.message ?? "save_failed";
    }

    // === レスポンス ===
    const item = { question_id: id, slot, scope, code: choice, comment, advice, affirm, score: 0.3, created_at, env };

    return NextResponse.json(
      { ok: true, item, comment, advice, affirm, score: 0.3, save_error },
      { status: 200, headers: { "cache-control": "no-store" } }
    );

  } catch (e: any) {
    console.error("診断API失敗:", e);
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal_error" },
      { status: 500, headers: { "cache-control": "no-store" } }
    );
  }
}
