// app/api/daily/save/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ========= Types ========= */
type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Env = "dev" | "prod";

type ScoreMap = Partial<Record<EV, number>>;

type Body = {
  user_id: string;

  // 時間帯・環境
  slot?: Slot;
  mode?: Slot; // alias of slot
  env?: Env;   // 'dev' (default) | 'prod'

  // トレース用
  question_id?: string | null;

  // テーマ（大文字/小文字どちらでも）
  scope?: string | null; // 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE'
  theme?: string | null; // 'work' | 'love' | 'future' | 'life'

  // 診断結果
  code: EV;
  score?: number | null;

  // 表示テキスト
  comment?: string | null;

  // advice family
  advice?: string | null;
  guidance?: string | null;
  tip?: string | null;

  // affirmation family
  affirm?: string | null;
  affirmation?: string | null;
  quote?: string | null;

  // 互換（既存フィールド）
  evla?: Record<string, number> | null;

  // ★ ベクトル保存（0〜1 でも 0〜100 でも可）
  score_map?: ScoreMap | null;
};

/* ========= Helpers ========= */

function bad(msg: string, status = 400) {
  return NextResponse.json({ ok: false, error: msg }, { status });
}

const to100 = (n: number) => (n <= 1 ? n * 100 : n);
const clamp100 = (n: number) => Math.max(0, Math.min(100, n));
const normNum = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n) ? clamp100(to100(n)) : undefined;

/** 選択肢から日次の score_map を自動生成（隣接を中、対向を低） */
function deriveDailyScoreMapFromChoice(choice?: EV): ScoreMap {
  const HI = 70, MID = 55, LOW = 40;
  switch (choice) {
    case "E": return { E: HI, V: MID, "Λ": LOW, "Ǝ": MID };
    case "V": return { V: HI, "Λ": MID, "Ǝ": LOW, E: MID };
    case "Λ": return { "Λ": HI, "Ǝ": MID, E: LOW, V: MID };
    case "Ǝ": return { "Ǝ": HI, E: MID, V: LOW, "Λ": MID };
    default:  return { E: 50, V: 50, "Λ": 50, "Ǝ": 50 };
  }
}

/* ========= Handler ========= */

export async function POST(req: NextRequest) {
  try {
    const sb = getSupabaseAdmin();
    if (!sb) return bad("supabase_env_missing", 500);

    const body = (await req.json()) as Body;

    /* ----- 入力バリデーション ----- */
    if (!body?.user_id) return bad("user_id_required");

    // slot（modeエイリアス対応）
    const slotRaw = (body.slot ?? body.mode) as Slot | undefined;
    const slot = (["morning", "noon", "night"] as Slot[]).includes(slotRaw as Slot)
      ? (slotRaw as Slot)
      : undefined;
    if (!slot) return bad("invalid_slot");

    const code = body.code;
    if (!["E", "V", "Λ", "Ǝ"].includes(code)) return bad("invalid_code");

    const env: Env =
      (["dev", "prod"] as Env[]).includes((body.env ?? "dev") as Env)
        ? ((body.env ?? "dev") as Env)
        : "dev";

    /* ----- 正規化 ----- */
    // scope は大文字、theme は小文字。どちらかしか来なくても相互補完。
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
      ["work", "love", "future", "life"].includes(themeNorm)
        ? themeNorm
        : scope?.toLowerCase() ?? null;

    // score は 0..100 に丸め
    const score =
      typeof body.score === "number" && Number.isFinite(body.score)
        ? Math.max(0, Math.min(100, Math.round(body.score)))
        : null;

    // 類義キー吸収
    const advice =
      (body.advice ?? body.guidance ?? body.tip ?? null)?.toString() ?? null;
    const affirm =
      (body.affirm ?? body.affirmation ?? body.quote ?? null)?.toString() ?? null;

    // 文字列サニタイズ
    const comment =
      typeof body.comment === "string" ? body.comment.slice(0, 800) : null;

    const question_id =
      typeof body.question_id === "string"
        ? body.question_id.slice(0, 120)
        : null;

    /* ----- score_map の決定（0〜1/0〜100 受容） ----- */
    const smIn: ScoreMap =
      (body.score_map as ScoreMap | null | undefined) ??
      deriveDailyScoreMapFromChoice(code as EV);

    const score_map = smIn
      ? {
          E: normNum(smIn.E),
          V: normNum(smIn.V),
          "Λ": normNum((smIn as any)["Λ"]),
          "Ǝ": normNum((smIn as any)["Ǝ"]),
        }
      : null;

    /* ----- UPSERT（user_id, date_jst, slot ユニーク） ----- */
    // date_jst は DB 側 DEFAULT ((now() at time zone 'Asia/Tokyo')::date) 想定
    const row = {
      user_id: body.user_id,
      slot,
      env,
      question_id,
      scope,         // 'WORK' | ... | null
      theme,         // 'work' | ... | null
      code,
      score,
      comment,
      advice,
      affirm,
      quote: body.quote ?? null,
      evla: body.evla ?? null,
      score_map,     // ★ ベクトル保存
    };

    const { data, error } = await sb
      .from("daily_results")
      .upsert(row, { onConflict: "user_id,date_jst,slot" })
      .select(
        "id, user_id, date_jst, slot, env, question_id, scope, theme, code, score, score_map, comment, advice, affirm, quote, created_at, updated_at"
      )
      .single();

    if (error) return bad(error.message, 500);

    return NextResponse.json(
      { ok: true, item: data },
      { headers: { "cache-control": "no-store" } }
    );
  } catch (e: any) {
    return bad(e?.message ?? "unknown_error", 500);
  }
}
