// app/api/daily/diagnose/route.ts
import { NextResponse } from "next/server";
import { getOpenAI } from "@/lib/openai";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/* ================== 型 ================== */
type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

type Body = {
  id: string;                     // フロントで発行した question_id 等
  slot: Slot;
  choice: EV;                     // 選択コード
  scope?: Scope;                  // WORK / LOVE / FUTURE / LIFE
  env?: "dev" | "prod";           // 任意: ログ分離
  theme?: "dev" | "prod";         // 既存互換
  ts?: string;                    // 任意: クライアント時刻
};

/* ================== スコープ説明 ================== */
const SCOPE_HINT: Record<Scope, string> = {
  WORK:   "仕事・学び・成果・チーム連携・自己効率",
  LOVE:   "恋愛・対人関係・信頼・距離感・感情のやり取り",
  FUTURE: "将来・目標・計画・成長・可能性の可視化",
  LIFE:   "生活全般・習慣・健康・心身の整え・日々の選択",
};

/* ================== 文字数ユーティリティ ================== */
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

/* ================== 仕様（記憶済み） ================== */
const LEN = {
  commentMin: 80,
  commentMax: 120,
  adviceMin: 80,
  adviceMax: 120,
  affirmMin: 15,
  affirmMax: 30,
} as const;

/* ================== アファメーション検査/補正 ================== */
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

/* ================== フォールバック文言 ================== */
const FB_COMMENT: Record<EV, string> = {
  E: `今は内側の熱が静かに満ちる時期。小さな確定を一つ重ねれば、惰性はほどけていく。視線を近くに置き、今日できる最短の一歩を形にしよう。`,
  V: `頭の中の未来像を、現実の手触りに寄せていく段階。理想は曖昧なままで良い。輪郭
