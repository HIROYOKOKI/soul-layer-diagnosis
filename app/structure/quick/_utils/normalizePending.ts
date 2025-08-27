// app/structure/quick/_utils/normalizePending.ts
export type PendingV1 = {
  choiceText: string;
  code: 'E'|'V'|'Λ'|'Ǝ';
  result: { type: string; weight: number; comment: string; advice?: string };
  _meta?: { ts: number; v: 'quick-v1' };
};

// 旧データ例: { structure:'E', type:'EVΛƎ型', weight:0.8, comment:'…', advice:'…' }
type Legacy = {
  structure?: 'E'|'V'|'Λ'|'Ǝ';
  type?: string;
  weight?: number;
  comment?: string;
  advice?: string;
  choiceText?: string;
  code?: 'E'|'V'|'Λ'|'Ǝ';
  result?: { type: string; weight: number; comment: string; advice?: string };
  _meta?: { ts: number; v?: string };
};

export function normalizePending(raw: string | null): PendingV1 | null {
  if (!raw) return null;
  try {
    const d: Legacy = JSON.parse(raw);

    // code は code or structure から決める
    const code = (d.code ?? d.structure) as PendingV1['code'] | undefined;

    // result は result or（type/weight/comment/advice）
    const result =
      d.result ??
      (d.type && typeof d.weight === 'number' && d.comment
        ? { type: d.type, weight: d.weight, comment: d.comment, advice: d.advice }
        : undefined);

    if (!code || !result?.type || typeof result.weight !== 'number' || !result.comment) {
      return null;
    }

    return {
      choiceText: d.choiceText ?? '',   // 旧データは空文字で通す（UIフォールバック）
      code,
      result,
      _meta: d._meta ?? { ts: Date.now(), v: 'quick-v1' },
    };
  } catch {
    return null;
  }
}
