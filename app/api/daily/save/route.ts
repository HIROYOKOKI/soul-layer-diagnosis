import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

// ▼ 型（最小）
type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Env = "dev" | "prod";

type Body = {
  user_id: string;                  // 必須：auth.users.id
  slot: Slot;                       // 必須：'morning' | 'noon' | 'night'
  env?: Env;                        // 既定: 'dev'（本番は'prod'で）
  question_id?: string | null;
  scope?: string | null;            // 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE' など自由文字列
  theme?: string | null;            // 実データは 'work'|'love'|'future'|'life' を想定

  code: EV;                         // 必須：'E'|'V'|'Λ'|'Ǝ'
  score?: number | null;            // 0..100 推奨
  comment?: string | null;
  advice?: string | null;
  affirm?: string | null;
  quote?: string | null;
  evla?: Record<string, number> | null; // 例 {"E":0.6,"V":0.2,"Λ":0.1,"Ǝ":0.1}
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

    // ---- 入力バリデーション（軽量）----
    if (!body?.user_id) return bad("user_id_required");
    const slot = body.slot;
    if (!slot || !["morning", "noon", "night"].includes(slot)) return bad("invalid_slot");
    const code = body.code;
    if (!code || !["E", "V", "Λ", "Ǝ"].includes(code)) return bad("invalid_code");

    const env: Env = body.env ?? "dev";
    if (!["dev", "prod"].includes(env)) return bad("invalid_env");

    // 数値のクランプ（任意）
    const score =
      typeof body.score === "number" && Number.isFinite(body.score)
        ? Math.max(0, Math.min(100, Math.round(body.score)))
        : null;

    // ---- アップサート ----
    // ユニークキーは (user_id, date_jst, slot)
    const row = {
      user_id: body.user_id,
      slot,
      env,
      question_id: body.question_id ?? null,
      scope: body.scope ?? null,
      theme: body.theme ?? null,

      code,
      score,
      comment: body.comment ?? null,
      advice: body.advice ?? null,
      affirm: body.affirm ?? null,
      quote: body.quote ?? null,
      evla: body.evla ?? null,
      // date_jst は DB の default ((now() at time zone 'Asia/Tokyo')::date) に任せる
    };

    const { data, error } = await sb
      .from("daily_results")
      .upsert(row, { onConflict: "user_id,date_jst,slot" })
      .select("id, user_id, date_jst, slot, code, score, comment, advice, affirm, quote, created_at, updated_at")
      .single();

    if (error) return bad(error.message, 500);

    return NextResponse.json({ ok: true, item: data });
  } catch (e: any) {
    return bad(e?.message ?? "unknown_error", 500);
  }
}
