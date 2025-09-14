// lib/text-guard.ts
export type Range = { min: number; max: number };

const jpLen = (s: string) => Array.from(s ?? "").length;

export function clampToRange(text: string, { min, max }: Range): string {
  const arr = Array.from((text || "").trim().replace(/\s+/g, " "));
  if (arr.length <= max) {
    // 末尾が句点でなければ軽く整える
    const out = arr.join("");
    return /[。.!?！？]$/.test(out) ? out : out + "。";
  }
  // 超過 → 句点/読点/スペースで気持ちよく切る
  const cut = arr.slice(0, max);
  const j = cut.join("");
  const m = j.match(/^(.*?)([。.!?！？]|、|,|;|：|:)\s*[^。.!?！？、,;：:]*$/);
  return (m?.[1] || j).replace(/\s+$/, "") + "。";
}

export const LENGTH = {
  comment: { min: 100, max: 150 },
  advice : { min: 100, max: 150 },
  quote  : { min:  15, max:  30 },
} as const;

export const inRange = (s: string, r: Range) => {
  const n = jpLen(s);
  return n >= r.min && n <= r.max;
};
