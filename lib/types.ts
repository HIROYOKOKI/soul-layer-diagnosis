// /lib/types.ts
export type Slot = "morning" | "noon" | "night";

export type Candidate = {
  id: string;
  label: string;
  pros?: string;
  cons?: string;
  risk?: number;
  cost?: number;
};

export type EBlock = {
  goal: string;
  urgency: number;
  constraints?: Record<string, unknown>;
};

export type LambdaPick = {
  pick: string;          // Candidate.id
  reason: string;
  rank_point: number;    // slotに応じた配点（3/2/1/0 など）
  confidence: number;    // 0..1
};

export type EpsilonBlock = {
  outcome_score: number | null; // ユーザーの主観レビューや自動採点
  notes?: string;
};

export type EvlaLog = {
  slot: Slot;
  mode: "EVΛƎ";
  E: EBlock;
  V: Candidate[];
  Lambda: LambdaPick;
  Epsilon: EpsilonBlock;
  NextV: { id: string; label: string }[];
};

export type UiResult = {
  comment: string; // 100–150字
  advice: string;  // 100–150字
  affirm: string;  // 15–30字
  score: number;   // 朝0.3/昼0.2/夜0.1（rank_point×0.1）
};

/* ============== API 契約（質問） ==============
/api/daily/question の返却契約（固定）
{
  ok: true,
  question: string,           // 50–100字
  choices: Candidate[],       // UI表示用（id/label）
  slot: Slot,
  question_id: string,        // daily-YYYY-MM-DD-<slot>
  seed: number
}
================================================ */

/* ============== API 契約（回答→結果） ==============
/api/daily/answer の返却契約（固定）
→ UiResult のみ（裏では EvlaLog を daily_results.evla に保存）
{ "comment":"...", "advice":"...", "affirm":"...", "score":0.3 }
==================================================== */
