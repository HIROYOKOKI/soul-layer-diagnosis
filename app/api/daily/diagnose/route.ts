// app/api/daily/diagnose/route.ts
import { NextResponse } from "next/server";
import { cookies as headerCookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================== 型 ================== */
type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";
type Env = "dev" | "prod";
type Body = {
  id: string;
  slot: Slot;
  choice: EV;
  scope?: Scope | string | null;
  env?: Env | string | null;
  ts?: string | number | null;
};

/* ================== ユーティリティ ================== */
const SCOPE_HINT: Record<Scope, string> = {
  WORK: "仕事・学び・成果・チーム連携・自己効率",
  LOVE: "恋愛・対人関係・信頼・距離感・感情のやり取り",
  FUTURE: "将来・目標・計画・成長・可能性の可視化",
  LIFE: "生活全般・習慣・健康・心身の整え・日々の選択",
};

function getJstSlot(now = new Date()): Slot {
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const h = jst.getUTCHours();
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "noon";
  return "night";
}

const jpLen = (s: string) => Array.from(s ?? "").length;
const clampToRange = (text: string, _min: number, max: number) => {
  const t = (text || "").trim().replace(/\s+/g, " ");
  if (!t) return t;
  if (jpLen(t) <= max) return /[。.!?！？]$/.test(t) ? t : t + "。";
  const arr = Array.from(t).slice(0, max);
  const j = arr.join("");
  const m =
    j.match(/^(.*?)([。.!?！？]|、|,|;|：|:)\s*[^。.!?！？、,;：:]*$/) ||
    j.match(/^(.*?)[\s　][^ \t　]*$/);
  const cut = (m?.[1] || j).replace(/\s+$/, "");
  return /[。.!?！？]$/.test(cut) ? cut : cut + "。";
};

const LEN = {
  commentMin: 100,
  commentMax: 150,
  adviceMin: 100,
  adviceMax: 150,
  affirmMin: 15,
  affirmMax: 30,
} as const;

/* ========== フォールバック文言 ========== */
const FB_COMMENT: Record<EV, string> = {
  E: `今は内側の熱が静かに満ちる時期。小さな確定を一つ重ねれば、惰性はほどけていく。視線を近くに置き、今日できる最短の一歩を形にしよう。`,
  V: `頭の中の未来像を、現実の手触りに寄せていく段階。理想は曖昧なままで良い。輪郭を一筆だけ濃くして、届く距離に引き寄せていこう。`,
  Λ: `迷いは選ぶための素材。条件を一つに絞れば、余計な枝葉は落ちていく。比較を止めて基準を決める。その確定が次の余白を生む。`,
  Ǝ: `静けさが判断を澄ませる。結論を急がず、観測を一拍置く。言葉にしない気配を拾えば、必要なものと不要なものが自然と分かれていく。`,
};
const FB_ADVICE: Record<EV, string> = {
  E: `今日の行動は十分に小さく。五分で終わる作業を今ここで始める。終えたら深呼吸し、次の一手は明日に残す。`,
  V: `理想の断片をノートに三行。明日やる一手を一文で決め、夜のうちに準備を一つだけ整える。`,
  Λ: `判断の基準を一つ決める。「迷ったら◯◯」を書き出し、それに従う。比較は一度だけに。`,
  Ǝ: `画面を閉じ、三分の無音をつくる。浮かんだ言葉を一語だけメモし、今夜はそこから先を求めない。`,
};
const FB_AFFIRM: Record<EV, string> = {
  E: `私は最小の一歩で流れを変える`,
  V: `私は理想の輪郭を近づけている`,
  Λ: `私は基準を決めて前に進む`,
  Ǝ: `私は静けさの中で答えを見る`,
};

/* ========== OpenAI 生成 ========== */
async function genWithAI(code: EV, slot: Slot, scope: Scope) {
  const openai = getOpenAI();
  if (!openai) throw new Error("openai_env_missing");

  const sys = [
    "あなたは『ルネア（Lunea）』。観測型のナビAIとして、短くやさしい日本語で話す。",
    `出力は必ずJSONのみ（説明文なし）。キーは "comment", "advice", "affirm"。`,
    `文字数: comment ${LEN.commentMin}〜${LEN.commentMax}字、advice ${LEN.adviceMin}〜${LEN.adviceMax}字、affirm ${LEN.affirmMin}〜${LEN.affirmMax}字。`,
    `affirmは必ず「私は…」or「わたしは…」で始める一人称・現在形。`,
    `comment/adviceはコード（E=衝動, V=可能性, Λ=選択, Ǝ=観測）とscopeの文脈に沿い、日常で使える具体性を持たせる。`,
  ].join("\n");

  const user = JSON.stringify({
    slot,
    scope,
    scope_hint: SCOPE_HINT[scope],
    code,
    style: "calm-positive",
  });

  const resp = await openai.chat.completions.create({
    model: "gpt-5-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const content = resp.choices[0]?.message?.content;
  if (!content) throw new Error("empty_openai_response");

  const parsed = JSON.parse(content);
  let comment = clampToRange(parsed.comment || "", LEN.commentMin, LEN.commentMax);
  let advice = clampToRange(parsed.advice || "", LEN.adviceMin, LEN.adviceMax);
  let affirm = clampToRange(parsed.affirm || "", LEN.affirmMin, LEN.affirmMax);
  if (!affirm.startsWith("私は") && !affirm.startsWith("わたしは")) {
    affirm = FB_AFFIRM[code];
  }
  return { comment, advice, affirm };
}

/* ================== ハンドラ ================== */
export async function POST(req: Request) {
  let stage: "parse" | "gen" | "save" | "respond" = "parse";

  try {
    const raw = (await req.json()) as Partial<Body>;
    if (!raw?.id || !raw?.slot || !raw?.choice) {
      return NextResponse.json(
        { ok: false, stage, error: "bad_request_missing_fields" },
        { status: 200, headers: { "cache-control": "no-store" } },
      );
    }

    const id = String(raw.id);
    const slot = (["morning", "noon", "night"].includes(String(raw.slot)) ? raw.slot : getJstSlot()) as Slot;
    const choice = String(raw.choice) as EV;
    const scope = (String(raw.scope ?? "LIFE").toUpperCase() as Scope);
    const themeTag = scope.toLowerCase() as "work" | "love" | "future" | "life";
    const env = (String(raw?.env ?? "prod").toLowerCase() as Env);
    const client_ts = raw?.ts ?? null;

    // === AI生成 ===
    stage = "gen";
    let comment: string | null = null;
    let advice: string | null = null;
    let affirm: string | null = null;
    let __source: "gpt" | "fallback" = "fallback";

    try {
      const ai = await genWithAI(choice, slot, scope);
      comment = ai.comment;
      advice = ai.advice;
      affirm = ai.affirm;
      if (comment && advice && affirm) __source = "gpt";
    } catch (e: any) {
      console.error("[daily/diagnose] AI生成エラー:", e?.message ?? e);
    }

    if (!comment) comment = FB_COMMENT[choice];
    if (!advice) advice = FB_ADVICE[choice];
    if (!affirm) affirm = FB_AFFIRM[choice];

    // === 保存 ===
    stage = "save";
    const created_at = new Date().toISOString();
    let save_error: any = null;
    try {
      const sb = getSupabaseAdmin();
      if (!sb) throw new Error("supabase_env_missing");

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
        theme: themeTag,
        code: choice,
        comment,
        advice,
        affirm,
        score: 0.3,
        created_at,
        env,
        client_ts,
        __source,
      };

      const { error } = await sb
        .from("daily_results")
        .upsert(payload, { onConflict: "user_id,question_id,env" });

      if (error) throw error;
    } catch (e: any) {
      console.error("[daily/diagnose] 保存エラー:", e);
      save_error = { message: e?.message ?? "save_failed" };
    }

    // === レスポンス ===
    stage = "respond";
    const item = {
      question_id: id,
      slot,
      scope,
      theme: themeTag,
      code: choice,
      comment,
      advice,
      affirm,
      score: 0.3,
      created_at,
      env,
      __source,
    };

    return NextResponse.json(
      { ok: true, item, save_error },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  } catch (e: any) {
    console.error("診断API失敗(stage=" + stage + "):", e);
    return NextResponse.json(
      { ok: false, stage, error: e?.message ?? "internal_error" },
      { status: 200, headers: { "cache-control": "no-store" } },
    );
  }
}
