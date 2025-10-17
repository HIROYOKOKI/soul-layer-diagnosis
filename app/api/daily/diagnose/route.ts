// app/api/daily/diagnose/route.ts
import { NextResponse } from "next/server";
import { cookies as headerCookies } from "next/headers";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";// app/api/daily/diagnose/route.ts
import { NextResponse } from "next/server";
import { cookies as headerCookies } from "next/headers";
import { getOpenAI } from "@/lib/openai";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================== 型 ================== */
type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

type Body = {
  id: string;
  slot: Slot;
  choice: EV;
  scope?: Scope;
  env?: "dev" | "prod";
  theme?: "dev" | "prod";
  ts?: string;
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
const inRange = (s: string, min: number, max: number) => {
  const n = jpLen((s || "").trim());
  return n >= min && n <= max;
};

const LEN = {
  commentMin: 100,
  commentMax: 150,
  adviceMin: 100,
  adviceMax: 150,
  affirmMin: 15,
  affirmMax: 30,
} as const;

const isAffirmation = (s: string) => {
  const t = (s || "").trim();
  if (!/^(私は|わたしは)/.test(t)) return false;
  if (/[「」『』《》"“”]/.test(t)) return false;
  return true;
};
const toAffirmationFallback = (code: EV): string => {
  switch (code) {
    case "E": return "私は情熱を信じ一歩踏み出す";
    case "V": return "私は理想を描き形にしている";
    case "Λ": return "私は基準を定め迷いを越える";
    case "Ǝ": return "私は静けさで本質を見つめる";
  }
};
const normalizeAffirmation = (code: EV, s: string): string => {
  let t = (s || "").trim().replace(/[「」『』《》"“”]/g, "").trim();
  if (!/^(私は|わたしは)/.test(t)) t = toAffirmationFallback(code);
  return clampToRange(t, LEN.affirmMin, LEN.affirmMax);
};

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

/* ========== OpenAI 出力 ========== */
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
    schema: {
      type: "object",
      properties: {
        comment: { type: "string" },
        advice: { type: "string" },
        affirm: { type: "string" },
      },
      required: ["comment", "advice", "affirm"],
    },
  });

  const resp = await openai.chat.completions.create({
    model: "gpt-5-mini",
    temperature: 0.6,
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
  affirm = normalizeAffirmation(code, affirm);
  return { comment, advice, affirm };
}

/* ================== ハンドラ ================== */
export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as any;
    const isLegacy = raw && (typeof raw.seed !== "undefined" || typeof raw.choiceId !== "undefined");

    let b: Body;
    if (isLegacy) {
      const c = headerCookies();
      const cookieSlot = c.get("daily_slot")?.value as Slot | undefined;
      const cookieTheme = (c.get("daily_theme")?.value as Scope | undefined) || "LIFE";
      const slot = (cookieSlot ?? getJstSlot()) as Slot;
      const jst = new Date(Date.now() + 9 * 3600 * 1000);
      const id = `daily-${jst.getUTCFullYear()}-${String(jst.getUTCMonth() + 1).padStart(2, "0")}-${String(jst.getUTCDate()).padStart(2, "0")}-${slot}`;
      const choice = String(raw.choiceId || "").toUpperCase() as EV;
      const scope = (String(raw.theme || cookieTheme || "LIFE").toUpperCase()) as Scope;
      b = { id, slot, choice, scope, env: "prod", theme: "prod", ts: new Date().toISOString() };
    } else {
      const nb = raw as Body;
      if (!nb?.id || !nb.slot || !nb.choice)
        return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
      b = { ...nb, env: nb.env ?? "prod", theme: nb.theme ?? "prod" };
    }

    const env = b.env;
    const theme = b.theme;
    const code = b.choice;
    const scope: Scope = (b.scope?.toUpperCase() as Scope) || "LIFE";

    // === AI生成 ===
    let comment: string | null = null;
    let advice: string | null = null;
    let affirm: string | null = null;
    try {
      const ai = await genWithAI(code, b.slot, scope);
      comment = ai.comment;
      advice = ai.advice;
      affirm = ai.affirm;
    } catch (e: any) {
      console.error("AI生成エラー:", e.message);
    }

    // fallback if null
    if (!comment) comment = FB_COMMENT[code];
    if (!advice) advice = FB_ADVICE[code];
    if (!affirm) affirm = FB_AFFIRM[code];

    // === 保存 ===
    const created_at = new Date().toISOString();
    let save_error: string | null = null;
    try {
      const sb = getSupabaseAdmin();
      await sb.from("daily_results").insert({
        id: b.id,
        slot: b.slot,
        scope,
        code,
        comment,
        advice,
        affirm,
        score: 0.3,
        created_at,
        env,
        theme,
        client_ts: b.ts ?? null,
      });
    } catch (e: any) {
      save_error = e?.message ?? "save_failed";
    }

    return NextResponse.json({
      ok: true,
      comment,
      advice,
      affirm,
      score: 0.3,
      save_error,
    });
  } catch (e: any) {
    console.error("診断API失敗:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "internal_error" }, { status: 500 });
  }
}

export const dynamic = "force-dynamic";

/* ================== 型 ================== */
type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

type Body = {
  id: string;   // 例: daily-YYYY-MM-DD-morning
  slot: Slot;
  choice: EV;   // 選択コード（E/V/Λ/Ǝ）
  scope?: Scope;        // 既定: LIFE
  env?: "dev" | "prod";
  theme?: "dev" | "prod";
  ts?: string;          // 任意: クライアント時刻
};

type EVLA = {
  slot: Slot;
  mode: "EVΛƎ";
  E: { goal: string; urgency: number; constraints: Record<string, unknown> };
  V: { id: string; label: string; risk: number; cost: number }[];
  Lambda: { pick: string; reason: string; rank_point: number; confidence: number };
  Epsilon: { outcome_score: number; notes: string };
  NextV: { id: string; label: string }[];
};

/* ================== ユーティリティ ================== */
const SCOPE_HINT: Record<Scope, string> = {
  WORK:   "仕事・学び・成果・チーム連携・自己効率",
  LOVE:   "恋愛・対人関係・信頼・距離感・感情のやり取り",
  FUTURE: "将来・目標・計画・成長・可能性の可視化",
  LIFE:   "生活全般・習慣・健康・心身の整え・日々の選択",
};

// JST = UTC+9
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

const inRange = (s: string, min: number, max: number) => {
  const n = jpLen((s || "").trim());
  return n >= min && n <= max;
};

/* ========== 文字数仕様 ========== */
const LEN = {
  commentMin: 100,
  commentMax: 150,
  adviceMin: 100,
  adviceMax: 150,
  affirmMin: 15,
  affirmMax: 30,
} as const;

/* ========== アファメーション検査/補正 ========== */
const isAffirmation = (s: string) => {
  const t = (s || "").trim();
  if (!/^(私は|わたしは)/.test(t)) return false;
  if (/[「」『』《》"“”]/.test(t)) return false;
  return true;
};

const toAffirmationFallback = (code: EV): string => {
  switch (code) {
    case "E": return "私は情熱を信じ一歩踏み出す";
    case "V": return "私は理想を描き形にしている";
    case "Λ": return "私は基準を定め迷いを越える";
    case "Ǝ": return "私は静けさで本質を見つめる";
  }
};

const normalizeAffirmation = (code: EV, s: string): string => {
  let t = (s || "").trim().replace(/[「」『』《》"“”]/g, "").trim();
  if (!/^(私は|わたしは)/.test(t)) t = toAffirmationFallback(code);
  return clampToRange(t, LEN.affirmMin, LEN.affirmMax);
};

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

/* ========== スロット → ランク点 ========== */
const rankPointsBySlot: Record<Slot, number[]> = {
  morning: [3, 2, 1, 0], // 4択
  noon: [2, 1, 0],       // 3択
  night: [1, 0],         // 2択
};

/* ========== EVΛƎ 生成ユーティリティ（MVP） ========== */
function extractE(slot: Slot, code: EV): EVLA["E"] {
  const goal = code === "E" ? "前進" : code === "V" ? "構想" : code === "Λ" ? "選択" : "観測";
  const urgency = slot === "morning" ? 0.6 : slot === "noon" ? 0.4 : 0.2;
  return { goal, urgency, constraints: {} };
}

function generateCandidates(E: EVLA["E"], n: number, slot: Slot): EVLA["V"] {
  const seeds =
    slot === "morning"
      ? ["5分だけ着手", "阻害要因を1つ整理", "関係者に一言連絡", "最小タスクを切る"]
      : slot === "noon"
      ? ["30分だけ集中", "優先順位を再整列", "不要作業を1つ捨てる"]
      : ["今日の記録を3行", "明日の最初の一手を書く"];
  return seeds.slice(0, n).map((label, i) => ({
    id: String.fromCharCode(65 + i), // A,B,C...
    label,
    risk: Number((0.1 + i * 0.1).toFixed(2)),
    cost: Number((0.1 + i * 0.1).toFixed(2)),
  }));
}

function chooseIndex(_V: EVLA["V"], _slot: Slot): number {
  // MVP: 常に 0 を選択（将来: rank_point × confidence − λrisk − λcost）
  return 0;
}

function toReason(E: EVLA["E"], picked: EVLA["V"]): string {
  return E.goal === "前進" ? "慣性をつくるための最小着手" : `目的「${E.goal}」に直結する一手`;
}

function toObserveNotes(Lambda: EVLA["Lambda"], V: EVLA["V"]): string {
  const label = V.find((x) => x.id === Lambda.pick)?.label ?? "";
  return `${label} を実行。小さな完了で流れを維持。`;
}

function generateNextV(slot: Slot): EVLA["NextV"] {
  const pool =
    slot === "morning"
      ? ["もう5分", "阻害要因解消", "共有"]
      : slot === "noon"
      ? ["一息観測", "30分再開", "不要を捨てる"]
      : ["明日の一手を一行", "記録の整頓", "早めに休む"];
  return pool.slice(0, 3).map((label, i) => ({ id: `N${i + 1}`, label }));
}

/* ========== OpenAI 生成（コメント/アドバイス/アファ） ========== */
async function genWithAI(code: EV, slot: Slot, scope: Scope) {
  const openai = getOpenAI();
  if (!openai) throw new Error("openai_env_missing");

  const sys = [
    "あなたは『ルネア（Lunea）』。観測型のナビAIとして、短くやさしい日本語で話す。",
    `出力は必ずJSONのみ（説明文なし）。キーは "comment", "advice", "affirm"。`,
    `文字数: comment ${LEN.commentMin}〜${LEN.commentMax}字、advice ${LEN.adviceMin}〜${LEN.adviceMax}字、affirm ${LEN.affirmMin}〜${LEN.affirmMax}字。`,
    `affirmは必ず「私は…」or「わたしは…」で始める一人称・現在形。引用・括弧・三人称禁止。`,
    `comment/adviceはコード（E=衝動, V=可能性, Λ=選択, Ǝ=観測）とscopeの文脈に沿い、日常で使える具体性を持たせる。`,
    `医療・法務・投資等の専門助言や危険行為の示唆は行わない。`,
  ].join("\n");

  const user = JSON.stringify({
    slot,
    scope,
    scope_hint: SCOPE_HINT[scope],
    code,
    style: "calm-positive",
    schema: {
      type: "object",
      properties: {
        comment: { type: "string" },
        advice: { type: "string" },
        affirm: { type: "string" },
      },
      required: ["comment", "advice", "affirm"],
    },
  });

  const resp = await openai.chat.completions.create({
    model: "gpt-5-mini",
    temperature: 0.7,
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user },
    ],
    response_format: { type: "json_object" },
  });

  const first = JSON.parse(resp.choices[0]?.message?.content || "{}") as {
    comment?: string;
    advice?: string;
    affirm?: string;
  };

  let comment = clampToRange(first.comment || "", LEN.commentMin, LEN.commentMax);
  let advice  = clampToRange(first.advice  || "", LEN.adviceMin , LEN.adviceMax );
  let affirm  = clampToRange(first.affirm  || "", LEN.affirmMin , LEN.affirmMax );

  const violate =
    !inRange(first.comment || "", LEN.commentMin, LEN.commentMax) ||
    !inRange(first.advice  || "", LEN.adviceMin , LEN.adviceMax ) ||
    !isAffirmation(first.affirm || "") ||
    !inRange(first.affirm || "", LEN.affirmMin, LEN.affirmMax);

  if (violate) {
    const resp2 = await openai.chat.completions.create({
      model: "gpt-5-mini",
      temperature: 0.4,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: JSON.stringify({ ...JSON.parse(user), note: "前回は制約外。厳守して再出力（JSONのみ）。" }) },
      ],
      response_format: { type: "json_object" },
    });

    const second = JSON.parse(resp2.choices[0]?.message?.content || "{}") as {
      comment?: string;
      advice?: string;
      affirm?: string;
    };

    comment = clampToRange(second.comment || comment, LEN.commentMin, LEN.commentMax);
    advice  = clampToRange(second.advice  || advice , LEN.adviceMin , LEN.adviceMax );
    affirm  = clampToRange(second.affirm  || affirm , LEN.affirmMin , LEN.affirmMax );
  }

  affirm = normalizeAffirmation(code, affirm);
  return { comment, advice, affirm };
}

/* ================== ハンドラ ================== */
export async function POST(req: Request) {
  try {
    const raw = (await req.json()) as any;

    // ---- 互換レイヤ：旧ペイロード {seed, choiceId, theme} を許容 ----
    const isLegacy = raw && (typeof raw.seed !== "undefined" || typeof raw.choiceId !== "undefined");

    let b: Body | null = null;

    if (isLegacy) {
      const c = headerCookies();
      const cookieSlot = c.get("daily_slot")?.value as Slot | undefined;
      const cookieTheme = (c.get("daily_theme")?.value as Scope | undefined) || "LIFE";
      const slot = (cookieSlot ?? getJstSlot()) as Slot;

      // id は daily-YYYY-MM-DD-slot（JST基準）
      const jst = new Date(Date.now() + 9 * 3600 * 1000);
      const y = jst.getUTCFullYear();
      const m = String(jst.getUTCMonth() + 1).padStart(2, "0");
      const d = String(jst.getUTCDate()).padStart(2, "0");
      const id = `daily-${y}-${m}-${d}-${slot}`;

      const choice = String(raw.choiceId || "").toUpperCase() as EV;
      const scope = (String(raw.theme || cookieTheme || "LIFE").toUpperCase()) as Scope;

      if (!"EVΛƎ".includes(choice)) {
        return NextResponse.json({ ok: false, error: "bad_choice" }, { status: 400 });
      }
      b = { id, slot, choice, scope, env: "dev", theme: "dev", ts: new Date().toISOString() };
    } else {
      // 新形式をそのまま利用
      const nb = raw as Body | null;
      if (!nb?.id || !nb.slot || !nb.choice) {
        return NextResponse.json({ ok: false, error: "bad_request" }, { status: 400 });
      }
      b = nb;
    }

    const env = b.env ?? "dev";
    const theme = b.theme ?? "dev";
    const code = b.choice;
    const scope: Scope = (b.scope?.toUpperCase() as Scope) || "LIFE";

    // 1) LLM生成（UI向け）
    let comment: string | null = null;
    let advice: string | null = null;
    let affirm: string | null = null;
    try {
      const ai = await genWithAI(code, b.slot, scope);
      comment = ai.comment?.trim() || null;
      advice  = ai.advice?.trim()  || null;
      affirm  = ai.affirm?.trim()  || null;
    } catch {
      // noop → フォールバックへ
    }
    if (!comment) comment = FB_COMMENT[code];
    if (!advice)  advice  = FB_ADVICE[code];
    if (!affirm)  affirm  = FB_AFFIRM[code];

    comment = clampToRange(comment, LEN.commentMin, LEN.commentMax);
    advice  = clampToRange(advice , LEN.adviceMin , LEN.adviceMax );
    affirm  = normalizeAffirmation(code, affirm);

    // 2) EVΛƎ 生成（裏ログ）
    const E = extractE(b.slot, code);
    const V = generateCandidates(E, rankPointsBySlot[b.slot].length, b.slot);
    const pickedIndex = chooseIndex(V, b.slot);
    const rankPoint = rankPointsBySlot[b.slot][pickedIndex] ?? 0;
    const Lambda = {
      pick: V[pickedIndex].id,
      reason: toReason(E, V[pickedIndex]),
      rank_point: rankPoint,
      confidence: 1.0,
    };
    const Epsilon = { outcome_score: 1, notes: toObserveNotes(Lambda, V) };
    const NextV = generateNextV(b.slot);
    const evla: EVLA = { slot: b.slot, mode: "EVΛƎ", E, V, Lambda, Epsilon, NextV };

    // 3) スコア（朝3/昼2/夜1 → ×0.1）
    const score = Math.round((rankPoint * 0.1) * 100) / 100;

    // 4) 保存（ベストエフォート）
    const created_at = new Date().toISOString();
    let save_error: string | null = null;
    try {
      const sb = getSupabaseAdmin();
      if (!sb) throw new Error("supabase_env_missing");
      await sb.from("daily_results").insert({
        id: b.id,
        slot: b.slot,
        scope,
        code,
        comment,
        advice,
        affirm,
        score,
        evla,               // JSONB
        created_at,
        env,
        theme,
        client_ts: b.ts ?? null,
      });
    } catch (e: any) {
      // 保存失敗はレスポンスを阻害しない
      save_error = e?.message ?? "save_failed";
    }

    // 5) 返却（後方互換：旧→フラット／新→構造化）
    if (isLegacy) {
      return NextResponse.json({ ok: true, comment, advice, affirm, score });
    } else {
      return NextResponse.json({
        ok: true,
        result: { comment, advice, affirm, score },
        item: {
          id: b.id,
          slot: b.slot,
          scope,
          code,
          comment,
          advice,
          affirm,
          score,
          env,
          theme,
          client_ts: b.ts ?? null,
          created_at,
          evla,
        },
        save_error,
      });
    }
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "internal_error" },
      { status: 500 }
    );
  }
}
