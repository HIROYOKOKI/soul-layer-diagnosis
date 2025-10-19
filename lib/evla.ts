// lib/evla.ts — safe stub to unblock build (TypeScript)

export type EV = "E" | "V" | "Λ" | "Ǝ";
export type Slot = "morning" | "noon" | "night";
export type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";

export type UiResult = {
  comment: string;
  advice: string;
  affirm: string;
};

export type EvlaInput = {
  theme?: "work" | "love" | "future" | "life";
  slot?: Slot;
  scope?: Scope;
  code?: EV;
};

export type EvlaLog = EvlaInput & {
  // 将来、スコアや中間ログを入れる想定のプレースホルダ
  trace?: Record<string, unknown>;
};

// 明示ヒント（テンプレ出力時に使う）
const THEME_HINTS: Record<NonNullable<EvlaInput["theme"]>, string> = {
  work: "仕事・学び・成果・チーム連携・自己効率",
  love: "恋愛・対人関係・信頼・距離感・感情のやり取り",
  future: "将来・目標・計画・成長・可能性の可視化",
  life: "生活全般・習慣・健康・心身の整え・日々の選択",
};

// ---- 既存互換: evla() ----
export function evla(): Record<string, never> {
  return {};
}

// ---- 既存互換: toUiProd() ----
// dev中は template を返し、本番では disabled を返す安全実装
export async function toUiProd(
  evla: EvlaLog
): Promise<UiResult & { __source: "disabled" | "gpt" | "template" }> {
  const base =
    (evla?.theme && THEME_HINTS[evla.theme]) ||
    "生活全般・習慣・健康・心身の整え・日々の選択";

  const DEV =
    (process.env.NEXT_PUBLIC_APP_MODE || process.env.NODE_ENV) !== "production";

  if (!DEV) {
    // 本番では明示的に無効
    return {
      comment: "",
      advice: "",
      affirm: "",
      __source: "disabled",
    };
  }

  // 開発テンプレ（定型文であることが判別できる中身）
  return {
    comment: `（template）${base} の観点から、今日は「最小の一歩」を意識して進めてみましょう。完璧さより反復を優先し、小さな達成を積み重ねることで流れが生まれます。`,
    advice: `（template）いまから5分で終わることを1つだけ着手→完了。終えたら深呼吸し、次の一手をメモに1行で書き残すだけに留めましょう。過剰に進めないのがコツです。`,
    affirm: "（template）私は小さな完了で流れをつくる",
    __source: "template",
  };
}

// ---- 追加: next* 系（呼び出し防止のダミー）----
export function nextV(_curr?: EV): EV {
  return "V";
}
export function nextE(_curr?: EV): EV {
  return "E";
}
export function nextΛ(_curr?: EV): EV {
  return "Λ";
}
export function nextƎ(_curr?: EV): EV {
  return "Ǝ";
}

// ---- 追加: generateCandidates（いくつかの呼び出しで参照されていた）----
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

export function generateCandidates(
  arg?: { slot?: Slot; theme?: string } | Slot
): Choice[] {
  const slot: Slot =
    typeof arg === "string" ? arg : (arg?.slot as Slot) || "morning";
  return FALLBACK[slot] ?? FALLBACK.morning;
}

// ---- default export（必要なら）----
export default {
  evla,
  toUiProd,
  nextV,
  nextE,
  nextΛ,
  nextƎ,
  generateCandidates,
};
