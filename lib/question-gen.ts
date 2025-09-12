// lib/question-gen.ts
import { createClient } from "@supabase/supabase-js";
import type { EV, DailyQuestion, Slot } from "./daily";
import { getSlot, buildQuestionId } from "./daily";

type Row = {
  code: EV | null;
  scores: Record<string, number> | null;
  comment: string | null;
  created_at: string;
};

const LABELS: Record<EV, string> = {
  E: "意志（E）",
  V: "感受（V）",
  Λ: "構築（Λ）",
  Ǝ: "反転（Ǝ）",
};

function defaultOptions(): { key: EV; label: string }[] {
  return (["E", "V", "Λ", "Ǝ"] as EV[]).map((k) => ({ key: k, label: LABELS[k] }));
}

// シンプルヒューリスティクス：直近N件の偏りから「迷いそうな2〜3択」を抽出
function pickSubset(rows: Row[], N = 12): EV[] | undefined {
  const recent = rows.slice(0, N);
  const freq: Record<EV, number> = { E: 0, V: 0, Λ: 0, Ǝ: 0 };
  for (const r of recent) if (r.code) freq[r.code]++;
  // 少ない順に2つ、同率が多い場合は3つ
  const sorted = (Object.keys(freq) as EV[]).sort((a, b) => freq[a] - freq[b]);
  const min = freq[sorted[0]];
  const candidates = sorted.filter((k) => freq[k] === min);
  if (candidates.length >= 2) return candidates.slice(0, Math.min(3, candidates.length));
  // 偏りが強いなら、最小2つ＋次点1つの3択
  return [sorted[0], sorted[1], sorted[2]];
}

function craftText(theme?: string): string {
  if (theme) {
    return `今日のテーマ「${theme}」。いま一歩、どちらに重心を置きますか？`;
  }
  return "いまのあなたの流れに近いのはどれ？重心を一点だけ選んでください。";
}

// 必要ならここでLLM呼び出しに差し替え可能（envが無ければヒューリスティクスで返す）
async function maybeLLMText(theme?: string): Promise<string | null> {
  if (!process.env.OPENAI_API_KEY) return null;
  // 最小限・安全運用：失敗時は null
  try {
    const prompt = theme
      ? `Theme: ${theme}. Write one short daily reflective question in Japanese (max 40 chars).`
      : `Write one short daily reflective question in Japanese (max 40 chars).`;
    // 擬似：ここはLLMクライアントを接続して返す
    // return await callLLM(prompt)
    return null; // いまは無効化
  } catch {
    return null;
  }
}

export async function generateQuestion(userId: string, slot?: Slot): Promise<DailyQuestion | null> {
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const s = slot ?? getSlot();
  const id = buildQuestionId(new Date(), s);

  // 直近履歴 & テーマ取得（失敗は許容）
  const { data: rows } = await supabase
    .from("daily_results")
    .select("code, scores, comment, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(24);

  const { data: profile } = await supabase
    .from("profiles")
    .select("theme")
    .eq("id", userId)
    .single();

  const theme: string | undefined = (profile as any)?.theme ?? undefined;
  const subset = rows ? pickSubset(rows as Row[]) : undefined;

  const llm = await maybeLLMText(theme);
  const text = llm ?? craftText(theme);

  const options = defaultOptions();
  const reduced = subset ? options.filter((o) => subset.includes(o.key)) : options;

  return { id, slot: s, text, options: reduced, subset: subset ?? undefined };
}

// ダミー（フェイルセーフ）
export function fallbackQuestion(slot: Slot): DailyQuestion {
  const id = buildQuestionId(new Date(), slot);
  return {
    id,
    slot,
    text: "今日の重心は？",
    options: defaultOptions(),
  };
}
