// lib/evla.ts — safe stub to unblock build
// ======================================================
// 将来的に EVΛƎ 構造モジュールに差し替える予定。
// 現状はビルドを通すためのダミー実装。
// ======================================================

export type UiResult = {
  comment: string;
  advice: string;
  affirm: string;
};

export type EvlaInput = {
  theme?: string;
  slot?: string;
  // ほか必要ならここに追加
};

// ------------------------------------------------------
// 既存互換: evla()
// ------------------------------------------------------
export function evla(): Record<string, never> {
  return {};
}

// ------------------------------------------------------
// 既存互換: toUiProd()
// ------------------------------------------------------
// __source は将来 "gpt" / "template" に切り替える前提
export async function toUiProd(
  _evla: EvlaInput
): Promise<UiResult & { __source: "disabled" | "gpt" | "template" }> {
  return {
    comment: "",
    advice: "",
    affirm: "",
    __source: "disabled",
  };
}

// ------------------------------------------------------
// 追加: nextV / nextE / nextΛ / nextƎ の安全スタブ
// ------------------------------------------------------
// EVΛƎ構造の簡易プレースホルダ。呼び出し側でエラーを出さないために定義。
export type EV = "E" | "V" | "Λ" | "Ǝ";

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

// ------------------------------------------------------
// デフォルトエクスポート (必要な場合)
// ------------------------------------------------------
export default {
  evla,
  toUiProd,
  nextV,
  nextE,
  nextΛ,
  nextƎ,
};
