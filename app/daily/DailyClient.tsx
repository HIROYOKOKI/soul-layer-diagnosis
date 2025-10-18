'use client';

import { useEffect, useMemo, useState } from "react";
import type { DailyQuestionResponse, DailyAnswerResponse, Slot, Theme } from "@/lib/types";

type Phase = "ask" | "result" | "error";

/* ===== ローカル強制フォールバック ===== */
const FALLBACK: Record<Slot, { id: string; label: string }[]> = {
  morning: [
    { id: "E", label: "直感で素早く動く" },
    { id: "V", label: "理想のイメージから始める" },
    { id: "Λ", label: "条件を決めて選ぶ" },
    { id: "Ǝ", label: "一拍置いて様子を見る" },
  ],
  noon: [
    { id: "E", label: "勢いで一歩進める" },
    { id: "V", label: "可能性を広げる選択をする" },
    { id: "Λ", label: "目的に沿って最短を選ぶ" },
  ],
  night: [
    { id: "Ǝ", label: "今日は観測と整理に徹する" },
    { id: "V", label: "明日に向けて静かに構想する" },
  ],
};

const needCount = (slot: Slot) => (slot === "morning" ? 4 : slot === "noon" ? 3 : 2);

/* ===== JSTでの現在スロット（クライアントで再計算） ===== */
function getJstSlotClient(date = new Date()): Slot {
  const h = Number(
    new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "numeric",
      hour12: false,
    }).format(date)
  );
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "noon";
  return "night";
}

export default function DailyClient() {
  const [phase, setPhase] = useState<Phase>("ask");
  const [loading, setLoading] = useState(false);

  // ヘッダ表示とフォールバック判定で使う“信頼できるスロット”
  const [slot, setSlot] = useState<Slot>(getJstSlotClient());

  // MyPageと同期するテーマ
  const [theme, setTheme] = useState<Theme>("LOVE");

  const [seed, setSeed] = useState<number>(0);
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<{ id: string; label: string }[]>([]);
  const [result, setResult] = useState<DailyAnswerResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        // ① テーマを固定（/api/theme）
        try {
          const rt = await fetch(`/api/theme`, { cache: "no-store" });
          const jt = await rt.json();
          const t = String(jt?.scope ?? jt?.theme ?? "LOVE").toUpperCase() as Theme;
          setTheme(t);
        } catch { /* LOVE のまま */ }

        // ② 質問取得
        const rq = await fetch(`/api/daily/question`, { cache: "no-store" });
        const jq = (await rq.json()) as DailyQuestionResponse;
        if (!jq.ok) throw new Error(jq.error || "failed_to_load");

        // サーバが返す slot は無視して、クライアントでJST再判定した値を採用
        const sClient = getJstSlotClient();
        setSlot(sClient);

        setSeed(jq.seed || 0);
        setQuestion(
          jq.question ||
            (sClient === "morning"
              ? "今のあなたに必要な最初の一歩はどれ？"
              : sClient === "noon"
              ? "このあと数時間で進めたい進路は？"
              : "今日はどんな締めくくりが心地いい？")
        );

        // ③ 強制フォールバック：必ず 2〜4 件にする
        const need = needCount(sClient);
        let arr =
          Array.isArray(jq.choices) && jq.choices.length
            ? jq.choices.filter((c) => c && c.label)
            : [];

        if (arr.length < need) {
          const have = new Set(arr.map((c) => c.id));
          for (const c of FALLBACK[sClient]) {
            if (arr.length >= need) break;
            if (!have.has(c.id)) arr.push(c);
          }
        }
        if (arr.length === 0) arr = FALLBACK[sClient].slice(0, need);
        setChoices(arr);

        setPhase("ask");
      } catch (e: any) {
        setErr(e?.message ?? "failed_to_load");
        setPhase("error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  async function onChoose(choiceId: string) {
    if (!seed) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/daily/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // フロントで固定した theme を送る
        body: JSON.stringify({ seed, choiceId, theme }),
      });
      const json = (await r.json()) as DailyAnswerResponse;
      if (!("ok" in json) || !json.ok) throw new Error((json as any)?.error ?? "failed");
      setResult(json);
      setPhase("result");
    } catch (e: any) {
      setErr(e?.message ?? "failed_to_answer");
      setPhase("error");
    } finally {
      setLoading(false);
    }
  }

  const header = useMemo(() => {
    const slotJp = slot === "morning" ? "朝" : slot === "noon" ? "昼" : "夜";
    const themeJp =
      theme === "WORK" ? "仕事" : theme === "LOVE" ? "愛" : theme === "FUTURE" ? "未来" : "生活";
    return `デイリー診断（${slotJp} × ${themeJp}）`;
  }, [slot, theme]);

  return (
    <>
      <h2 className="text-base font-semibold mb-4 text-white">{header}</h2>

      {loading && <p className="opacity-80">読み込み中…</p>}
      {phase === "error" && <p className="text-red-400">エラー：{err}</p>}

      {phase === "ask" && !loading && (
        <div className="space-y-4">
          <p className="opacity-90">{question}</p>

          {choices.length > 0 ? (
            <div className="grid gap-3 mt-4">
              {choices.map((c) => (
                <button
                  key={c.id}
                  disabled={loading}
                  className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left"
                  onClick={() => onChoose(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          ) : (
            <p className="opacity-70">選択肢が取得できませんでした。</p>
          )}
        </div>
      )}

      {phase === "result" && result && "ok" in result && result.ok && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl p-4 border border-white/10 bg-white/5">
            <div className="text-sm uppercase tracking-wider opacity-60 mb-2">コメント</div>
            <p>{(result as any).comment}</p>
          </div>
          <div className="rounded-2xl p-4 border border-white/10 bg-white/5">
            <div className="text-sm uppercase tracking-wider opacity-60 mb-2">アドバイス</div>
            <p>{(result as any).advice}</p>
          </div>
          <div className="rounded-2xl p-4 border border-white/10 bg-white/5">
            <div className="text-sm uppercase tracking-wider opacity-60 mb-2">アファメーション</div>
            <p className="font-medium">{(result as any).affirm}</p>
          </div>
          <div className="rounded-2xl p-4 border border-white/10 bg-white/5 flex items-center justify-between">
            <span className="text-sm uppercase tracking-wider opacity-60">スコア</span>
            <span className="text-xl font-semibold">{(result as any).score}</span>
          </div>
        </div>
      )}

      {/* デバッグ補助（必要なら残す） */}
      <div className="mt-8 opacity-70 text-sm">
        <details>
          <summary>デバッグ</summary>
          <pre className="mt-2 text-xs opacity-60">{JSON.stringify({ slot, theme, seed, choices }, null, 2)}</pre>
        </details>
      </div>
    </>
  );
}
