// app/daily/question/QuestionClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import type { Slot, Theme, DailyQuestionResponse, DailyAnswerResponse } from "@/lib/types";

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

/* JSTでの現在スロット（クライアントで再判定） */
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

/* ===== 名前プレフィックス保証（重複防止） ===== */
function ensureNamePrefix(text: string | undefined, name?: string | null): string {
  const t = (text ?? "").trim();
  if (!t) return "";
  const n = (name ?? "").trim();
  if (!n) return t;
  const prefix = `${n}さん、`;
  // 先頭の空白（半角/全角）を無視して判定
  const headTrimmed = t.replace(/^[\s\u3000]+/, "");
  return headTrimmed.startsWith(prefix) ? t : `${prefix}${t}`;
}

/* ===== choices の形を {id,label} に正規化（堅牢化） ===== */
function normalizeChoices(input: any): { id: string; label: string }[] {
  if (!Array.isArray(input)) return [];
  return input
    .map((c) => {
      if (!c) return null;
      // よくあるバリエーション: {id,label} / {key,text} / {value,label}
      const id = String(c.id ?? c.key ?? c.value ?? "").trim();
      const label = String(c.label ?? c.text ?? "").trim();
      if (!id || !label) return null;
      return { id, label };
    })
    .filter(Boolean) as { id: string; label: string }[];
}

export default function QuestionClient({ initialTheme }: { initialTheme: Theme }) {
  const [phase, setPhase] = useState<Phase>("ask");
  const [loading, setLoading] = useState(false);

  // ヘッダ表示とフォールバックに使う“信頼できる”スロット
  const [slot, setSlot] = useState<Slot>(getJstSlotClient());

  // MyPageから渡されたテーマで固定（APIのthemeは無視）
  const [theme, setTheme] = useState<Theme>(initialTheme);

  const [seed, setSeed] = useState<number>(0);
  const [question, setQuestion] = useState("");
  const [choices, setChoices] = useState<{ id: string; label: string }[]>([]);
  const [result, setResult] = useState<DailyAnswerResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // /api/me からのユーザー名（表示用の最終保険）
  const [meName, setMeName] = useState<string | null>(null);

  // ユーザー名取得（最初に一度だけ）
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const r = await fetch("/api/me", { cache: "no-store" });
        const j = await r.json().catch(() => null);
        if (!alive) return;
        const name =
          j?.item?.name ??
          j?.name ??
          j?.item?.display_id ??
          j?.item?.user_no ??
          (j?.item?.email ? String(j.item.email).split("@")[0] : null) ??
          null;
        setMeName(typeof name === "string" ? name : null);
      } catch {
        if (!alive) return;
        setMeName(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  // 質問の取得
  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        // /api/daily/question を叩く（レスポンスの slot / theme は採用しない）
        const rq = await fetch(`/api/daily/question`, { cache: "no-store" });
        const jq = (await rq.json()) as DailyQuestionResponse;
        if (!jq.ok) throw new Error(jq.error || "failed_to_load");

        // スロットはクライアントで再計算したものを使う
        const s = getJstSlotClient();
        if (!alive) return;
        setSlot(s);

        setSeed((jq as any).seed || 0);

        // 問いのテキスト（API出力 or ローカル既定）→ 表示直前に ensureNamePrefix する
        const baseQ =
          (jq as any).question ||
          (s === "morning"
            ? "今のあなたに必要な最初の一歩はどれ？"
            : s === "noon"
            ? "このあと数時間で進めたい進路は？"
            : "今日はどんな締めくくりが心地いい？");
        setQuestion(String(baseQ ?? ""));

        // choices 正規化＋強制フォールバック：必ず 2〜4 件にする
        const parsed = normalizeChoices((jq as any).choices);
        const need = needCount(s);

        let arr = parsed.filter((c) => c && c.label);
        if (arr.length < need) {
          const have = new Set(arr.map((c) => c.id));
          for (const c of FALLBACK[s]) {
            if (arr.length >= need) break;
            if (!have.has(c.id)) arr.push(c);
          }
        }
        if (arr.length === 0) arr = FALLBACK[s].slice(0, need);
        setChoices(arr);

        setPhase("ask");
      } catch (e: any) {
        setErr(e?.message ?? "failed_to_load");
        setPhase("error");
      } finally {
        if (!alive) return;
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [initialTheme]);

  async function onChoose(choiceId: string) {
    if (!seed) return;
    setLoading(true);
    try {
      const r = await fetch(`/api/daily/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // 固定したテーマを送る（MyPageと一致）
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

  // 表示時に「◯◯さん、」を保証（APIが既に名前入りでも重複しない）
  const displayQuestion = useMemo(
    () => ensureNamePrefix(question, meName),
    [question, meName]
  );

  const displayComment = useMemo(() => {
    const c = (result as any)?.comment as string | undefined;
    return ensureNamePrefix(c, meName);
  }, [result, meName]);

  return (
    <>
      <h2 className="text-base font-semibold mb-4 text-white">{header}</h2>

      {loading && <p className="opacity-80">読み込み中…</p>}
      {phase === "error" && <p className="text-red-400">エラー：{err}</p>}

      {phase === "ask" && !loading && (
        <div className="space-y-4">
          <p className="opacity-90">{displayQuestion}</p>

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
            <p>{displayComment}</p>
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
    </>
  );
}
