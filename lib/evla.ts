// /lib/evla.ts
import type {
  Slot, EBlock, Candidate, LambdaPick, EpsilonBlock, EvlaLog, UiResult
} from "@/lib/types";

/** JSTの現在日時を取得 */
export function nowJst(): Date {
  const now = new Date();
  // JST = UTC+9
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 9 * 60 * 60000);
}

/** スロット決定（JST） */
export function getSlotJst(d: Date = nowJst()): Slot {
  const h = d.getHours();
  if (h < 11) return "morning";
  if (h < 18) return "noon";
  return "night";
}

/** 日付キー（YYYY-MM-DD） */
export function ymd(d: Date = nowJst()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** スロット別配点（順位→点） */
export const rankPoint = (s: Slot, i: number) =>
  s === "morning" ? [3, 2, 1, 0][i] ?? 0 :
  s === "noon"    ? [2, 1, 0][i]     ?? 0 :
                    [1, 0][i]        ?? 0;

/** E 抽出：スロットからその日の意図を定義 */
export function extractE(slot: Slot): EBlock {
  const goal = slot === "morning" ? "前進" : slot === "noon" ? "集中" : "締め";
  const urgency = slot === "morning" ? 0.4 : slot === "noon" ? 0.3 : 0.2;
  return { goal, urgency, constraints: {} };
}

/** V 生成：候補（3件を既定、スロットに応じて文言微調整） */
export function generateCandidates(E: EBlock, n = 3): Candidate[] {
  if (E.goal === "前進") {
    return [
      { id: "A", label: "5分だけ着手", risk: 0.1, cost: 0.1 },
      { id: "B", label: "阻害要因を1つ整理", risk: 0.1, cost: 0.2 },
      { id: "C", label: "関係者に一言連絡", risk: 0.2, cost: 0.2 },
    ].slice(0, n);
  }
  if (E.goal === "集中") {
    return [
      { id: "A", label: "1つだけ深掘り", risk: 0.15, cost: 0.15 },
      { id: "B", label: "中断要因を遮断", risk: 0.15, cost: 0.2 },
      { id: "C", label: "区切り時間を設定", risk: 0.1, cost: 0.1 },
    ].slice(0, n);
  }
  // 締め
  return [
    { id: "A", label: "今日の記録を1行", risk: 0.05, cost: 0.05 },
    { id: "B", label: "明日の最初の一歩を決める", risk: 0.1, cost: 0.1 },
    { id: "C", label: "関係者に一言だけ共有", risk: 0.1, cost: 0.15 },
  ].slice(0, n);
}

/** Λ 選択：ユーザーのpickがあれば優先。無ければ自動スコアで選ぶ */
export function choose(E: EBlock, V: Candidate[], slot: Slot, userPickId?: string): LambdaPick {
  if (userPickId) {
    const idx = Math.max(0, V.findIndex(v => v.id === userPickId));
    return {
      pick: V[idx]?.id ?? V[0].id,
      reason: E.goal === "前進" ? "自分の衝動に沿った最短の一歩を選択" :
              E.goal === "集中" ? "一点集中で全体の推進力を高めるため" :
                                   "今日を区切り、安心して休むため",
      rank_point: rankPoint(slot, idx),
      confidence: 1.0
    };
  }

  const λ = 0.2;
  const scored = V
    .map((v, i) => ({ v, i, score: (3 - i) - λ * ((v.risk ?? 0) + (v.cost ?? 0)) }))
    .sort((a, b) => b.score - a.score)[0];
  return {
    pick: scored.v.id,
    reason: E.goal === "前進" ? "慣性をつくるには最小の着手が効果的" :
            E.goal === "集中" ? "雑音を下げ集中を最大化できる" :
                                 "完了感が翌日の再開を助ける",
    rank_point: rankPoint(slot, scored.i),
    confidence: 0.9
  };
}

/** Ǝ 観測テンプレ：暫定で一定の肯定スコア */
export function observeTemplate(_: LambdaPick, __: Candidate[]): EpsilonBlock {
  return { outcome_score: 1, notes: "小さな達成を確認" };
}

/** NextV：次の一歩（保存のみ。UIでは今は出さない） */
export const nextV = (_: EpsilonBlock, __: LambdaPick) => ([
  { id: "N1", label: "もう5分だけ進める" },
  { id: "N2", label: "阻害要因を1つだけ解消" },
  { id: "N3", label: "関係者へ短文で共有" },
]);

/** EvlaLog → UiResult（文字数仕様を満たす） */
export function toUi(evla: EvlaLog): UiResult {
  // スコアは rank_point × 0.1（朝0.3/昼0.2/夜0.1 の範囲）
  const score = evla.Lambda.rank_point * 0.1;

  const comment =
    evla.E.goal === "前進"
      ? "今日は“未来へ向けた最初の一歩”を整える日。完璧を狙わず、小さく進めるほど勢いが生まれます。迷いを感じたら、始める前に手を温めるイメージで深呼吸を一回。行動のハードルを下げることで、心が軽くなり、次の流れが自然と見えてきます。"
      : evla.E.goal === "集中"
      ? "いまは一点集中が最も効くタイミング。やることを一つに絞り、余白を確保してから着手しましょう。中断のトリガーを先に断ち、時間の上限を決めて取り組むと、緊張が解けて手が動きます。深く潜るほど、全体の進みも整っていきます。"
      : "今日は“締め”が明日を助ける合図。完璧ではなく区切りをつくることで、安心してリズムを持ち越せます。今日の気づきを一行だけ残し、明日の最初の一歩を一つ決めてから休みましょう。小さな完了が、次の日のスムーズな再開を支えます。";

  const advice =
    evla.E.goal === "前進"
      ? "ToDoを3つだけ書き出し、いちばん軽いものから着手しましょう。5分だけ進める“最初の一手”を作ると、その後の行動が自然に続きます。阻害要因が見えたら、まずは要因の名前を付けるだけでもOK。認識するだけで、次の選択が楽になります。"
      : evla.E.goal === "集中"
      ? "30〜45分の集中ブロックを1本だけ用意し、開始前に通知・雑音をオフに。『ここまでできたら区切る』という最低ラインを先に決め、終わったら短い達成メモを残しましょう。集中の前後に余白を置くと、負担が軽くなり、継続しやすくなります。"
      : "今日のログを1行だけ書き、明日の最初の一歩を先に予約しましょう。連絡すべき人がいれば短文で構いません。寝る前に端末を遠ざけ、心の余白をつくると、翌朝の始動が驚くほど軽くなります。区切りは、体力と意志力の再充電でもあります。";

  const affirm =
    evla.E.goal === "前進"
      ? "私は未来を描き、いま一歩を選べる"
      : evla.E.goal === "集中"
      ? "私は集中の力で道を開く"
      : "私は今日を区切り、明日へつなぐ";

  return { comment, advice, affirm, score };
}
