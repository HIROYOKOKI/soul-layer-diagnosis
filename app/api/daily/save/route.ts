// app/api/daily/save/route.ts
import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getSupabaseAdmin } from "@/lib/supabase-admin";  // ★ 追加

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Env = "dev" | "prod";
type ScoreMap = Partial<Record<EV, number>>;

type Body = {
  user_id?: string;
  slot?: Slot;
  mode?: Slot;
  force_slot?: boolean;
  env?: Env;
  question_id?: string | null;
  scope?: string | null;
  theme?: string | null;
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
  score_map?: ScoreMap | null;
};

const bad = (m: string, s = 400) =>
  NextResponse.json({ ok: false, error: m }, { status: s, headers: { "cache-control": "no-store" } });

const to100 = (n: number) => (n <= 1 ? n * 100 : n);
const clamp100 = (n: number) => Math.max(0, Math.min(100, n));
const normNum = (n?: number | null) =>
  typeof n === "number" && Number.isFinite(n) ? clamp100(to100(n)) : undefined;

// ロケール依存を避けた堅牢なJST時刻
function detectJstSlot(): Slot {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const jst = new Date(utcMs + 9 * 60 * 60000);
  const h = jst.getUTCHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "noon";
  return "night";
}

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

export async function POST(req: NextRequest) {
  try {
    // 1) 認証はCookie（uid取得用）
    const authSb = createRouteHandlerClient({ cookies });
    const { data: au } = await authSb.auth.getUser();

    // 2) 本文
    const body = (await req.json()) as Body;

    // 3) uid：body.user_id > cookie の順で取得（curl検証も可）
    const uid = body.user_id ?? au?.user?.id ?? null;
    if (!uid) return bad("not_authenticated", 401);

    // 4) slot：既定はJST自動判定。force_slot=true の時だけ上書き許可
    const isValidSlot = (s?: string): s is Slot => !!s && ["morning","noon","night"].includes(s);
    const slotIn = (body.slot ?? body.mode) as Slot | undefined;
    const slot: Slot = body.force_slot === true && isValidSlot(slotIn) ? slotIn! : detectJstSlot();

    // 5) 残りの正規化
    const code = body.code;
    if (!["E", "V", "Λ", "Ǝ"].includes(code)) return bad("invalid_code");

    const env: Env = (["dev","prod"] as Env[]).includes((body.env ?? "dev") as Env) ? (body.env as Env) : "dev";

    const scopeNorm = (body.scope ?? body.theme ?? "").toString().trim().toUpperCase();
    const scope = (["WORK","LOVE","FUTURE","LIFE"] as const).includes(scopeNorm as any) ? (scopeNorm as any) : null;

    const themeNorm = (body.theme ?? body.scope ?? "").toString().trim().toLowerCase();
    const theme = ["work","love","future","life"].includes(themeNorm) ? themeNorm : scope?.toLowerCase() ?? null;

    const score =
      typeof body.score === "number" && Number.isFinite(body.score)
        ? Math.max(0, Math.min(100, Math.round(body.score)))
        : null;

    const advice = (body.advice ?? body.guidance ?? body.tip ?? null)?.toString() ?? null;
    const affirm = (body.affirm ?? body.affirmation ?? body.quote ?? null)?.toString() ?? null;
    const comment = typeof body.comment === "string" ? body.comment.slice(0, 800) : null;
    const question_id = typeof body.question_id === "string" ? body.question_id.slice(0, 120) : null;

    const smIn: ScoreMap = (body.score_map as ScoreMap | null | undefined) ?? deriveDailyScoreMapFromChoice(code as EV);
    const score_map = smIn ? {
      E: normNum(smIn.E),
      V: normNum(smIn.V),
      "Λ": normNum((smIn as any)["Λ"]),
      "Ǝ": normNum((smIn as any)["Ǝ"]),
    } : null;

    // 6) 行オブジェクト
    const row = {
      user_id: uid,          // RLSに依らず記録（Adminで挿入）
      slot,
      env,
      question_id,
      scope,
      theme,
      code,
      score,
      comment,
      advice,
      affirm,
      quote: body.quote ?? null,
      evla: body.evla ?? null,
      score_map,
    };

    // 7) ★ 挿入は Admin で実行（RLSバイパス）
    const admin = getSupabaseAdmin();
    if (!admin) return bad("supabase_env_missing", 500);

    const { data, error } = await admin
      .from("daily_results")
      .upsert(row, { onConflict: "user_id,date_jst,slot" })
      .select("id, user_id, date_jst, slot, env, scope, theme, code, created_at")
      .single();

    if (error) return bad(error.message, 500);

    // デバッグヘッダ（必要なければ後で外す）
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const jst = new Date(utcMs + 9 * 60 * 60000);
    const hourJst = jst.getUTCHours();

    const resp = NextResponse.json({ ok: true, item: data }, { headers: { "cache-control": "no-store" } });
    resp.headers.set("x-debug-slot-in", String(body.slot ?? body.mode ?? ""));
    resp.headers.set("x-debug-force-slot", String(body.force_slot === true));
    resp.headers.set("x-debug-detected", slot);
    resp.headers.set("x-debug-hour-jst", String(hourJst));
    return resp;
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? "unknown_error" }, { status: 500 });
  }
}
