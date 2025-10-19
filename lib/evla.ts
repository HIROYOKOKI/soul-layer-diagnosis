// lib/evla.ts — safe stub to unblock build (TypeScript)

export type EV = "E" | "V" | "Λ" | "Ǝ";
export type Slot = "morning" | "noon" | "night";
export type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

export type UiResult = { comment: string; advice: string; affirm: string };

export type EvlaInput = {
  theme?: "work" | "love" | "future" | "life";
  slot?: Slot;
  scope?: Scope;
  code?: EV;
};

export type EvlaLog = EvlaInput & { trace?: Record<string, unknown> };

const THEME_HINTS: Record<NonNullable<EvlaInput["theme"]>, string> = {
  work: "仕事・学び・成果・チーム連携・自己効率",
  love: "恋愛・対人関係・信頼・距離感・感情のやり取り",
  future: "将来・目標・計画・成長・可能性の可視化",
  life: "生活全般・習慣・健康・心身の整え・日々の選択",
};

// ---- 互換: evla() ----
export function evla(): Record<string, never> { return {}; }

// ---- 互換: toUiProd() ----
export async function toUiProd(
  evla: EvlaLog
): Promise<UiResult & { __source: "disabled" | "gpt" | "template" }> {
  const base = (evla?.theme && THEME_HINTS[evla.theme]) || "生活全般・習慣・健康・心身の整え・日々の選択";
  const DEV = (process.env.NEXT_PUBLIC_APP_MODE || process.env.NODE_ENV) !== "production";
  if (!DEV) return { comment: "", advice: "", affirm: "", __source: "disabled" };
  return {
    comment: `（template）${base} の観点から、今日は「最小の一歩」を意識して進めてみましょう。完璧さより反復を優先し、小さな達成を積み重ねることで流れが生まれます。`,
    advice: `（template）いまから5分で終わることを1つだけ着手→完了。終えたら深呼吸し、次の一手をメモに1行で書き残すだけに留めましょう。過剰に進めないのがコツです。`,
    affirm: "（template）私は小さな完了で流れをつくる",
    __source: "template",
  };
}

// ---- next* ダミー ----
export function nextV(_curr?: EV): EV { return "V"; }
export function nextE(_curr?: EV): EV { return "E"; }
export function nextΛ(_curr?: EV): EV { return "Λ"; }
export function nextƎ(_curr?: EV): EV { return "Ǝ"; }

// ---- 候補生成（fallback）----
export type Choice = { key: EV; label: string };
const FALLBACK: Record<Slot, Choice[]> = {
  morning: [
    { key: "E", label: "直感で素早く動く" },
    { key: "V", label: "可能性を広げて考える" },
    { key: "Λ", label: "条件を整理して選ぶ" },
    { key: "Ǝ", label: "まず観測してから動く" },
  ],
  noon: [
    { key: "E", label: "勢いで切り拓く" },
    { key: "V", label: "発想を広げる" },
    { key: "Λ", label: "合理で決める" },
    { key: "Ǝ", label: "事実を見直す" },
  ],
  night: [
    { key: "E", label: "衝動に従う" },
    { key: "V", label: "夢や余白を残す" },
    { key: "Λ", label: "選択肢を絞る" },
    { key: "Ǝ", label: "静かに振り返る" },
  ],
};
export function generateCandidates(arg?: { slot?: Slot; theme?: string } | Slot): Choice[] {
  const slot: Slot = typeof arg === "string" ? arg : (arg?.slot as Slot) || "morning";
  return FALLBACK[slot] ?? FALLBACK.morning;
}

// ---- extract* ダミー ----
export function extractE(src?: string | EV): EV { return normalizeToEV(src) ?? "E"; }
export function extractV(src?: string | EV): EV { return normalizeToEV(src) ?? "V"; }
export function extractΛ(src?: string | EV): EV { return normalizeToEV(src) ?? "Λ"; }
export function extractƎ(src?: string | EV): EV { return normalizeToEV(src) ?? "Ǝ"; }
function normalizeToEV(src?: string | EV): EV | null {
  if (!src) return null;
  if (src === "E" || src === "V" || src === "Λ" || src === "Ǝ") return src;
  const s = String(src).toUpperCase();
  if (/\bE\b|IMPULSE|ENERGY|衝動|直感|勢い/.test(s)) return "E";
  if (/\bV\b|POSSIBILITY|VISION|可能|夢|余白|発想/.test(s)) return "V";
  if (/Λ|LAMBDA|CHOICE|SELECT|DECIDE|選択|判断|基準|合理/.test(s)) return "Λ";
  if (/Ǝ|OBSERV|MONITOR|REFLECT|観測|振り返り|静けさ|事実/.test(s)) return "Ǝ";
  return null;
}

// ---- default export ----
export default {
  evla,
  toUiProd,
  nextV, nextE, nextΛ, nextƎ,
  generateCandidates,
  extractE, extractV, extractΛ, extractƎ,
};
TS


/usr/bin/file -I lib/evla.ts
dos2unix lib/evla.ts 2>/dev/null || true

npx tsc -p tsconfig.json --noEmit
npm run build
