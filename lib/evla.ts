// lib/evla.ts
import type {
  Slot, Theme, EBlock, Candidate, LambdaPick,
  EpsilonBlock, EvlaLog, UiResult
} from "@/lib/types";

// ============ Slot & Score ============
export const detectJstSlot = (): Slot => {
  const now = new Date();
  const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const h = jst.getUTCHours();
  if (h < 11) return "morning";   // ~ 20:59 JST → 任意調整OK
  if (h < 16) return "noon";      // ~ 25:59 JST
  return "night";
};

export const slotScoreWeight = (slot: Slot) =>
  slot === "morning" ? 0.3 : slot === "noon" ? 0.2 : 0.1;

export const rankPoint = (slot: Slot, i: number) =>
  slot === "morning" ? [3, 2, 1, 0][i] ?? 0
  : slot === "noon" ? [2, 1, 0][i] ?? 0
  : [1, 0][i] ?? 0;

// ============ Seed Utils ============
// 簡易PRNG（seed固定で日内同一表示）
export function seededPick<T>(arr: T[], seed: number): T {
  if (!arr.length) throw new Error("seededPick: empty array");
  const x = Math.sin(seed) * 10000;
  const idx = Math.floor(Math.abs(x - Math.floor(x)) * arr.length);
  return arr[idx % arr.length];
}

// ============ Theme Prompts ============
const THEME_HINTS: Record<Theme, {
  eGoal: string; eExplain: string;
  advice: string; affirm: string[];
}> = {
  WORK: {
    eGoal: "仕事の前進",
    eExplain: "今日は成果へ向けた小さな一歩を形にしましょう。",
    advice: "ToDoを３つだけ書き出し優先度を決めて着手。５分の着火で流れをつくる。",
    affirm: [
      "私は小さな前進で成果を育てる",
      "私は集中を選び、仕事を進める",
      "私は完了を積み重ねて信頼を築く",
    ],
  },
  LOVE: {
    eGoal: "関係性の温度を上げる",
    eExplain: "相手の気持ちに寄り添いながら、心の距離を少し縮めます。",
    advice: "相手の良い変化を１つ言葉で伝える。短く丁寧に、タイミングを逃さない。",
    affirm: [
      "私は思いやりで関係を育てる",
      "私は対話で心を結び直す",
      "私は愛を選び、愛を受け取る",
    ],
  },
  FUTURE: {
    eGoal: "未来の土台づくり",
    eExplain: "遠回りに見える準備が、明日以降の大きな加速に繋がります。",
    advice: "理想の１シーンを30秒だけ具体化。道具・人・場所を書き出して一手進める。",
    affirm: [
      "私は未来の種をいま植える",
      "私は理想を描き、道筋を選ぶ",
      "私は今日の一手で明日を変える",
    ],
  },
  LIFE: {
    eGoal: "生活の巡りを整える",
    eExplain: "心身の余白をつくると、全体の流れが自然に良くなります。",
    advice: "５分だけ整える。机の上／メール受信箱／気になっている１点を軽く片づける。",
    affirm: [
      "私は整えることで軽くなる",
      "私は余白をつくり、流れを戻す",
      "私は今日を整え、明日に渡す",
    ],
  },
};

// ============ EVΛƎ Blocks ============
// E（意図）をslot×themeから抽出
export function extractE(slot: Slot, theme: Theme): EBlock {
  const base = THEME_HINTS[theme];
  const goal =
    slot === "morning" ? base.eGoal
    : slot === "noon" ? "集中と調整"
    : "締めと確認";
  const urgency = slot === "morning" ? 0.6 : slot === "noon" ? 0.45 : 0.3;
  return { goal, urgency, constraints: { theme, note: base.eExplain } };
}

// 候補（V）：slot×themeで中身と数を変える
export function generateCandidates(slot: Slot, theme: Theme, n?: number): Candidate[] {
  const pool: Record<Theme, Candidate[]> = {
    WORK: [
      { id: "A", label: "５分だけ着手", risk: 0.1, cost: 0.1 },
      { id: "B", label: "阻害要因を１つ除去", risk: 0.2, cost: 0.2 },
      { id: "C", label: "関係者に一言共有", risk: 0.2, cost: 0.1 },
      { id: "D", label: "見積もりを更新", risk: 0.1, cost: 0.2 },
    ],
    LOVE: [
      { id: "A", label: "感謝を一言メッセージ", risk: 0.05, cost: 0.1 },
      { id: "B", label: "相手の近況を質問", risk: 0.1, cost: 0.1 },
      { id: "C", label: "共通の予定を１つ提案", risk: 0.2, cost: 0.2 },
      { id: "D", label: "相手の好みを１つ調べる", risk: 0.05, cost: 0.1 },
    ],
    FUTURE: [
      { id: "A", label: "30秒で理想の情景を描写", risk: 0.05, cost: 0.05 },
      { id: "B", label: "必要資源を３つ列挙", risk: 0.1, cost: 0.1 },
      { id: "C", label: "初期ステップを１つ予約", risk: 0.2, cost: 0.2 },
      { id: "D", label: "先行事例を１つ確認", risk: 0.1, cost: 0.1 },
    ],
    LIFE: [
      { id: "A", label: "机上を５分だけ整える", risk: 0.05, cost: 0.05 },
      { id: "B", label: "受信箱を10通だけ処理", risk: 0.1, cost: 0.1 },
      { id: "C", label: "生活の詰まりを１つ解消", risk: 0.2, cost: 0.2 },
      { id: "D", label: "休息の５分を予定に入れる", risk: 0.05, cost: 0.05 },
    ],
  };

  const base = pool[theme];
  const size = n ?? (slot === "morning" ? 4 : slot === "noon" ? 3 : 2);
  return base.slice(0, size);
}

// Λ（選択）：簡易スコアで自動選択
export function choose(E: EBlock, V: Candidate[], slot: Slot): LambdaPick {
  const λ = 0.2;
  const scored = V.map((v, i) => ({
    v, i, score: (3 - i) - λ * ((v.risk ?? 0) + (v.cost ?? 0))
  })).sort((a, b) => b.score - a.score)[0];

  const reason = E.goal.includes("締め") ? "今日の完了感を高めるため" :
                  E.goal.includes("集中") ? "一点集中で歩幅を広げるため" :
                  "最小の着火で慣性を生むため";

  return {
    pick: scored.v.id,
    reason,
    rank_point: rankPoint(slot, scored.i),
    confidence: 1.0,
  };
}

// Ǝ（観測テンプレ）
export function observeTemplate(_: LambdaPick, __: Candidate[]): EpsilonBlock {
  return { outcome_score: 1, notes: "小さな達成を確認" };
}

// NextV（保存のみ・UI非表示）
export const nextV = (_: EpsilonBlock, __: LambdaPick) => ([
  { id: "N1", label: "もう５分だけ続ける" },
  { id: "N2", label: "阻害要因を先に１つ外す" },
  { id: "N3", label: "成果を一言共有する" },
]);

// ============ UI 整形（テーマ反映＆字数ガード） ============
// 上限だけを守る（下限はLLM生成やテンプレ側で担保）
const clampLen = (s: string, _min: number, max: number) => {
  const t = s.trim().replace(/\s+/g, " ");         // 空白整形
  // 句点連打が入っていた場合の保険（既存データにも効く）
  const noPad = t.replace(/(。+)\s*$/u, "。");
  return noPad.length > max ? noPad.slice(0, max) : noPad;
};


export function toUi(evla: EvlaLog): UiResult {
  const w = slotScoreWeight(evla.slot);
  const score = Number((evla.Lambda.rank_point * w / Math.max(1, (evla.slot === "morning" ? 3 : evla.slot === "noon" ? 2 : 1))).toFixed(2)); // 目安

  const base = THEME_HINTS[evla.theme];

  const comment =
    evla.slot === "morning"
      ? `今日は${base.eGoal}に向けて最初の火を灯す日。${base.eExplain} 無理なく${evla.Lambda.reason}、小さな慣性を作りましょう。`
      : evla.slot === "noon"
      ? `午後は集中と調整で全体の歩幅を広げる時間。${base.eExplain} 迷いが出たら優先度を一つに絞り、${evla.Lambda.reason}。`
      : `一日の締めは「完了」を置くほど明日が軽くなります。${base.eExplain} 今日は${evla.Lambda.reason}。短い完了で流れを戻しましょう。`;

  const advice = base.advice;
  const affirm = seededPick(base.affirm, evla.Lambda.rank_point + (evla.theme.charCodeAt(0) % 7));

  return {
    comment: clampLen(comment, 100, 150),
    advice: clampLen(advice, 100, 150),
    affirm: clampLen(affirm, 15, 30),
    score: evla.slot === "morning" ? 0.3 : evla.slot === "noon" ? 0.2 : 0.1,
  };
}
