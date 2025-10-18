// app/api/daily/save/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Env = "dev" | "prod";

type Body = {
  user_id: string;
  slot?: Slot;                 // allow alias: mode
  mode?: Slot;                 // alias
  env?: Env;                   // 'dev' (default) | 'prod'

  question_id?: string | null;

  scope?: string | null;       // 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE' (maybe mixed case)
  theme?: string | null;       // 'work' | 'love' | 'future' | 'life' (maybe mixed case)

  code: EV;
  score?: number | null;

  comment?: string | null;

  // advice family
  advice?: string | null;
  guidance?: string | null;
  tip?: string | null;

  // affirmation family
  affirm?: string | null;
  affirmation?: string | null;
  quote?: string | null;

  evla?: Record<string, number> | null;
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return bad("supabase_env_missing", 500);

    const body = (await req.json()) as Body;

    // ---------- 入力バリデーション ----------
    if (!body?.user_id) return bad("user_id_required");

    // slot は mode エイリアスも受ける
    const slotRaw = (body.slot ?? body.mode) as Slot | undefined;
    const slot = (["morning", "noon", "night"] as Slot[]).includes(slotRaw as Slot)
      ? (slotRaw as Slot)
      : undefined;
    if (!slot) return bad("invalid_slot");

    const code = body.code;
    if (!["E", "V", "Λ", "Ǝ"].includes(code)) return bad("invalid_code");

    const env: Env = (["dev", "prod"] as Env[]).includes((body.env ?? "dev") as Env)
      ? ((body.env ?? "dev") as Env)
      : "dev";

    // ---------- 正規化 ----------
    // SCOPE は大文字に、THEME は小文字に（なければ互いから推定）
    const scopeNorm = (body.scope ?? body.theme ?? "")
      .toString()
      .trim()
      .toUpperCase();
    const scope =
      (["WORK", "LOVE", "FUTURE", "LIFE"] as const).includes(scopeNorm as any)
        ? (scopeNorm as "WORK" | "LOVE" | "FUTURE" | "LIFE")
        : null;

    const themeNorm = (body.theme ?? body.scope ?? "")
      .toString()
      .trim()
      .toLowerCase();
    const theme =
      ["work", "love", "future", "life"].includes(themeNorm) ? themeNorm : scope?.toLowerCase() ?? null;

    // score クランプ（0..100 / 整数）
    const score =
      typeof body.score === "number" && Number.isFinite(body.score)
        ? Math.max(0, Math.min(100, Math.round(body.score)))
        : null;

    // advice/affirm のフォールバック（類義キーも吸収）
    const advice =
      (body.advice ?? body.guidance ?? body.tip ?? null)?.toString() ?? null;
    const affirm =
      (body.affirm ?? body.affirmation ?? body.quote ?? null)?.toString() ?? null;

    // 文字数の軽いサニタイズ（任意・安全側）
    const comment =
      (body.comment ?? null) && typeof body.comment === "string"
        ? body.comment.slice(0, 800)
        : null;

    const question_id =
      typeof body.question_id === "string" ? body.question_id.slice(0, 120) : null;

    // ---------- UPSERT ----------
    // ユニークキー: (user_id, date_jst, slot)
    // ※ date_jst は DB 側の DEFAULT ((now() at time zone 'Asia/Tokyo')::date) で自動付与される前提
    const row = {
      user_id: body.user_id,
      slot,
      env,
      question_id,
      scope,            // 'WORK'|'LOVE'|'FUTURE'|'LIFE' | null
      theme,            // 'work'|'love'|'future'|'life' | null
      code,
      score,
      comment,
      advice,
      affirm,
      quote: body.quote ?? null,
      evla: body.evla ?? null,
    };

    const { data, error } = await sb
      .from("daily_results")
      .upsert(row, { onConflict: "user_id,date_jst,slot" })
      .select(
        "id, user_id, date_jst, slot, env, question_id, scope, theme, code, score, comment, advice, affirm, quote, created_at, updated_at"
      )
      .single();

    if (error) return bad(error.message, 500);

    return NextResponse.json({ ok: true, item: data }, { headers: { "cache-control": "no-store" } });
  } catch (e: any) {
    return bad(e?.message ?? "unknown_error", 500);
  }
}
