// lib/evla.ts — safe stub to unblock build

export type EV = "E" | "V" | "Λ" | "Ǝ";
export type Slot = "morning" | "noon" | "night";

export type UiResult = {
  comment: string;
  advice: string;
  affirm: string; // ← UI側が "affirmation" なら後で合わせる
};

export type EvlaInput = {
  theme?: string;
  slot?: Slot;
};

// ---- 互換: evla() ----
export function evla(): Record<string, never> {
  return {};
}

// ---- 互換: toUiProd() ----
export async function toUiProd(
  _evla: EvlaInput
): Promise<UiResult & { __source: "disabled" | "gpt" | "template" }> {
  return { comment: "", advice: "", affirm: "", __source: "disabled" };
}

// ---- 追加: next* 系（呼び出し防止のダミー）----
export function nextV(_curr?: EV): EV { return "V"; }
export function nextE(_curr?: EV): EV { return "E"; }
export function nextΛ(_curr?: EV): EV { return "Λ"; }
export function nextƎ(_curr?: EV): EV { return "Ǝ"; }

// ---- 追加: generateCandidates（今回のエラー原因）----
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

// 呼び出し側が {slot, theme} や (slot) を渡しても受けられるように緩く実装
export function generateCandidates(
  arg?: { slot?: Slot; theme?: string } | Slot
): Choice[] {
  const slot: Slot =
    typeof arg === "string" ? arg :
    (arg?.slot ?? "morning");
  return FALLBACK[slot] ?? FALLBACK.morning;
}

// （必要なら使えるよう default も用意）
export default {
  evla,
  toUiProd,
  nextV,
  nextE,
  nextΛ,
  nextƎ,
  generateCandidates,
};
