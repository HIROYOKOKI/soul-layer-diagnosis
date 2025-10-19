// lib/evla.ts — safe stub to unblock build

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

// 既存コード互換: evla() を呼んでいる箇所があっても問題にならないように
export function evla(): Record<string, never> {
  return {};
}

// 既存コード互換: toUiProd(...) を呼ぶ側がいても落ちないように
// __source は将来の実装で "gpt" / "template" に切り替える前提
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
