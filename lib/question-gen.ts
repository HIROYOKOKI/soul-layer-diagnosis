// lib/question-gen.ts
// DBアクセスなしの純関数ユーティリティ

import type { EV, DailyQuestion, Slot } from "./daily";
import { buildQuestionId } from "./daily";

export type Row = {
  code: EV | null;
  scores?: Record<string, number> | null;
  comment?: string | null;
  created_at: string | Date;
};

const LABELS: Record<EV, string> = {
  E: "意志（E）",
  V: "感受（V）",
  Λ: "構築（Λ）",
  Ǝ: "反転（Ǝ）",
};

const ALL_OPTIONS: { key: EV; label: string }[] = (["E", "V", "Λ", "Ǝ"] as EV[]).map((k) => ({
  key: k,
  label: LABELS[k],
}));

/** 直近N件の偏りから「迷いそうな2〜3択」を抽出（少数派優先） */
function pickSubset(rows: Row[], N = 12): EV[] | undefined {
  const recent = (rows ?? []).slice(0, N);
  const freq: Record<EV, number> = { E: 0, V: 0, Λ: 0, Ǝ: 0 };
  for (const r of recent) if (r.code) freq[r.code]++;
  const sorted = (Object.keys(freq) as EV[]).sort((a, b) => freq[a] - freq[b]);
  const min = freq[sorted[0]];
  const least = sorted.filter((k) => freq[k] === min);
  if (least.length >= 2) return least.slice(0, Math.min(3, least.length));
  return [sorted[0], sorted[1], sorted[2]];
}

function craftText(theme?: string): string {
  return theme
    ? `今日のテーマ「${theme}」。いま一歩、どこに重心を置く？`
    : "いまの流れに近いのは？重心を一点だけ。";
}

/** 呼び出し元で集めた rows/theme から質問を構築（純関数） */
export function buildQuestionFromData(
  userId: string,          // 署名用（今は未使用）
  slot: Slot,
  rows: Row[] | null | undefined,
  theme?: string
): DailyQuestion {
  const id = buildQuestionId(new Date(), slot);
  const subset = rows ? pickSubset(rows) : undefined;
  const options = subset ? ALL_OPTIONS.filter((o) => subset.includes(o.key)) : ALL_OPTIONS;

  return {
    id,
    slot,
    text: craftText(theme),
    options,
    ...(subset ? { subset } : {}),
  };
}

/** ダミー（フェイルセーフ） */
export function fallbackQuestion(slot: Slot): DailyQuestion {
  const id = buildQuestionId(new Date(), slot);
  return { id, slot, text: "今日の重心は？", options: ALL_OPTIONS };
}
