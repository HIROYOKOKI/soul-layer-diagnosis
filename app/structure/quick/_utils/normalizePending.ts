// app/structure/quick/_utils/normalizePending.ts

export type PendingV1 = {
  choiceText: string;
  code: 'E' | 'V' | 'Λ' | 'Ǝ';
  result: { type: string; weight: number; comment: string; advice?: string };
  _meta?: { ts: number; v: 'quick-v1' };
};

// 旧データ例
type Legacy = {
  structure?: 'E'|'V'|'Λ'|'Ǝ';
  type?: string;
  weight?: number;
  comment?: string;
  advice?: string;
  choiceText?: string;
  code?: 'E'|'V'|'Λ'|'Ǝ';
  result?: { type: string; weight: number; comment: string; advice?: string };
  _meta?: { ts?: number; v?: string };
};

// 正規のメタを返すヘルパー（型ガード込み）
function toMeta(m?: Legacy['_meta']): PendingV1['_meta'] {
  if (m && typeof m.ts === 'number' && m.v === 'quick-v1') {
    // 既に正規ならそのまま
    return { ts: m.ts, v: 'quick-v1' };
  }
  // 旧 or 不完全 → 正規値で補完
  return { ts: Date.now(), v: 'quick-v1' };
}

export function normalizePending(raw: string | null): PendingV1 | null {
  if (!raw) return null;
  try {
    const d: Legacy = JSON.parse(raw);

    // code は code or structure
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
      choiceText: d.choiceText ?? '',   // 旧データは空文字でフォールバック
      code,
      result,
      _meta: toMeta(d._meta),           // ✅ ここを正規化して型を満たす
    };
  } catch {
    return null;
  }
}
