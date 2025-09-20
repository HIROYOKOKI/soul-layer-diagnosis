// lib/types.ts
export type EV = "E" | "V" | "Λ" | "Ǝ";
export type Slot = "morning" | "noon" | "night";
export type Theme = "WORK" | "LOVE" | "FUTURE" | "LIFE";

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
  urgency: number; // 0..1
  constraints?: Record<string, unknown>;
};

export type LambdaPick = {
  pick: string; // Candidate.id
  reason: string;
  rank_point: number; // slotに応じた配点
  confidence: number; // 0..1
};

export type EpsilonBlock = {
  outcome_score: number | null; // 0..1 | null（未観測）
  notes?: string;
};

export type EvlaLog = {
  slot: Slot;
  mode: "EVΛƎ";
  theme: Theme;
  E: EBlock;
  V: Candidate[];
  Lambda: LambdaPick;
  Epsilon: EpsilonBlock;
  NextV: { id: string; label: string }[];
};

export type UiResult = {
  comment: string; // 100-150字目安
  advice: string;  // 100-150字目安
  affirm: string;  // 15-30字目安
  score: number;   // 朝0.3 / 昼0.2 / 夜0.1（既定）
};

// API I/O
export type DailyQuestionResponse = {
  ok: true;
  seed: number;
  slot: Slot;
  theme: Theme;
  question: string;
  choices: { id: string; label: string }[]; // 候補A/B/C..（slotで個数可変）
} | { ok: false; error: string };

export type DailyAnswerRequest = {
  seed: number;
  slot?: Slot;          // 省略時はJSTから自動推定
  theme?: Theme;        // 省略時は "WORK"
  choiceId: string;     // "A" | "B" | "C" ...
};

export type DailyAnswerResponse = UiResult & {
  ok: true;
} | { ok: false; error: string };
