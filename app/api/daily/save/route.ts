// app/api/daily/save/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ========= Types ========= */
type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Env = "dev" | "prod";

type ScoreMap = Partial<Record<EV, number>>;

type Body = {
  user_id?: string;
  slot?: Slot;
  mode?: Slot;               // alias of slot
  force_slot?: boolean;      // true の時だけ slot を尊重
  env?: Env;                 // 'dev' (default) | 'prod'
  question_id?: string | null;
  scope?: string | null;     // 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE'
  theme?: string | null;     // 'work' | 'love' | 'future' | 'life'
  code: EV;
  score?: number | null;
  comment?: string | null;
  advice?: string | null;
  guidance?: string | null;
  tip?: string | null;
  affirm?: string | null;
  affirmation?: string | null;
  quote?: string | null;
  evla?: Record<string, number> | null;
  score_map?: ScoreMap | null; // 0〜1 / 0〜100 どちらでも可
};

/* ========= Helpers ========= */
const bad = (msg: string, status = 400) =>
  NextResponse.json({ ok: false, error: msg }, { status, headers: { "cache-control": "no-store" } });

const to100 = (n: number) => (n <= 1 ? n * 100 : n);
const clamp100 = (n: number) => Math.max(0, Math.min(100, n));
const normNum = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n) ? clamp100(to100(n)) : undefined;

/** JSTの現在時刻から slot を自動判定（ロケール依存を避けた堅牢版） */
function detectJstSlot(): Slot {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utcMs + 9 * 60 * 60000);
  const h = jst.getUTCHours(); // JSTの時
  if (h >= 5 && h < 11) return "morning"; // 05:00-10:59
  if (h >= 11 && h < 17) return "noon";   // 11:00-16:59
  return "night";                         // 17:00-04:59
}

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
    const sb = createRouteHandlerClient({ cookies });
    const { data: au } = await sb.auth.getUser();
    const body = (await req.json()) as Body;

    const uid = body.user_id ?? au?.user?.id ?? null;
    if (!uid) return bad("not_authenticated", 401);

    // ========== DEBUG: 受信可視化 ==========
    // JST 現在時刻も記録
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const jst = new Date(utcMs + 9 * 60 * 60000);
    const hourJst = jst.getUTCHours();
    console.info("[daily/save] DEBUG recv", {
      slot: body.slot,
      mode: body.mode,
      force_slot: body.force_slot,
      env: body.env,
      scope: body.scope,
      theme: body.theme,
      code: body.code,
      nowJST: jst.toISOString(),
      hourJST: hourJst,
      user_id_in_body: !!body.user_id,
      authed: !!au?.user?.id,
    });
    // ======================================

    /* ----- 入力バリデーション ----- */
    const isValidSlot = (s?: string): s is Slot =>
      !!s && ["morning", "noon", "night"].includes(s);

    // 既定は JST 自動判定。force_slot=true のときだけクライアント指定を尊重。
    const slotIn = (body.slot ?? body.mode) as Slot | undefined;
    const slot: Slot =
      body.force_slot === true && isValidSlot(slotIn) ? slotIn! : detectJstSlot();

    const code = body.code;
    if (!["E", "V", "Λ", "Ǝ"].includes(code)) return bad("invalid_code");

    const env: Env =
      (["dev", "prod"] as Env[]).includes((body.env ?? "dev") as Env)
        ? ((body.env ?? "dev") as Env)
        : "dev";

    /* ----- 正規化 ----- */
    const scopeNorm = (body.scope ?? body.theme ?? "").toString().trim().toUpperCase();
    const scope =
      (["WORK", "LOVE", "FUTURE", "LIFE"] as const).includes(scopeNorm as any)
        ? (scopeNorm as "WORK" | "LOVE" | "FUTURE" | "LIFE")
        : null;

    const themeNorm = (body.theme ?? body.scope ?? "").toString().trim().toLowerCase();
    const theme = ["work", "love", "future", "life"].includes(themeNorm)
      ? themeNorm
      : scope?.toLowerCase() ?? null;

    const score =
      typeof body.score === "number" && Number.isFinite(body.score)
        ? Math.max(0, Math.min(100, Math.round(body.score)))
        : null;

    const advice = (body.advice ?? body.guidance ?? body.tip ?? null)?.toString() ?? null;
    const affirm = (body.affirm ?? body.affirmation ?? body.quote ?? null)?.toString() ?? null;

    const comment = typeof body.comment === "string" ? body.comment.slice(0, 800) : null;
    const question_id = typeof body.question_id === "string" ? body.question_id.slice(0, 120) : null;

    const smIn: ScoreMap = (body.score_map as ScoreMap | null | undefined) ?? deriveDailyScoreMapFromChoice(code as EV);
    const score_map = smIn
      ? {
          E: normNum(smIn.E),
          V: normNum(smIn.V),
          "Λ": normNum((smIn as any)["Λ"]),
          "Ǝ": normNum((smIn as any)["Ǝ"]),
        }
      : null;

    /* ----- UPSERT（user_id, date_jst, slot ユニーク） ----- */
    const row = {
      user_id: uid,
      slot,               // JST自動判定 or 明示指定（force_slot=true）
      env,
      question_id,
      scope,              // 'WORK' | ... | null
      theme,              // 'work' | ... | null
      code,
      score,
      comment,
      advice,
      affirm,
      quote: body.quote ?? null,
      evla: body.evla ?? null,
      score_map,
    };

    const { data, error } = await sb
      .from("daily_results")
      .upsert(row, { onConflict: "user_id,date_jst,slot" })
      .select(
        "id, user_id, date_jst, slot, env, question_id, scope, theme, code, score, score_map, comment, advice, affirm, quote, created_at, updated_at"
      )
      .single();

    if (error) return bad(error.message, 500);

    // ========== DEBUG: レスポンスヘッダで可視化 ==========
    const resp = NextResponse.json(
      { ok: true, item: data },
      { headers: { "cache-control": "no-store" } }
    );
    resp.headers.set("x-debug-slot-in", String(body.slot ?? body.mode ?? ""));
    resp.headers.set("x-debug-force-slot", String(body.force_slot === true));
    resp.headers.set("x-debug-detected", slot);
    resp.headers.set("x-debug-hour-jst", String(hourJst));
    // ======================================
    return resp;
  } catch (e: any) {
    return bad(e?.message ?? "unknown_error", 500);
  }
}
