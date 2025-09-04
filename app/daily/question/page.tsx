// app/daily/question/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";

/* =========================
   型
   ========================= */
type EV = "E" | "V" | "Λ" | "Ǝ";
type QResp = {
  ok: boolean;
  question?: string;
  choices?: string[]; // 4択想定
  seed?: string | number;
  error?: string;
};
type DReq = {
  choice: string;
  theme?: string; // dev 分離用
};
type DResp = {
  ok: boolean;
  code?: EV;               // E / V / Λ / Ǝ
  comment?: string;        // 一言コメント
  quote?: string;          // 格言など
  navigator?: string | null;
  error?: string;
};

type SaveResp = { ok: boolean; stored?: boolean; error?: string };

/* =========================
   ユーティリティ
   ========================= */
// 記号の正規化（"∃" や "A" を許容）
function normalizeCode(x?: string | null): EV | null {
  const s = (x || "").trim();
  if (s === "∃" || s === "ヨ") return "Ǝ";
  if (s === "A") return "Λ";
  if (["E", "V", "Λ", "Ǝ"].includes(s)) return s as EV;
  return null;
}

function getThemeForLog() {
  // UIテーマ（配色）と診断テーマ（devログ分離）は別レイヤー
  // dev分離用に "ev-theme"（配色）とは別で "dev" を優先的に入れる運用
  const t = (typeof localStorage !== "undefined" ? localStorage.getItem("ev-theme") : null) || "dev";
  return t;
}

/* =========================
   ページ本体
   ========================= */
export default function DailyQuestionPage() {
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState<string>("");
  const [choices, setChoices] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  const [diagLoading, setDiagLoading] = useState(false);
  const [result, setResult] = useState<{ code: EV; comment: string; quote: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const theme = useMemo(getThemeForLog, []);

  /* ---------- Q1. 質問の取得 ---------- */
  const fetchQuestion = async () => {
    setLoading(true);
    setError(null);
    setSelected(null);
    setResult(null);
    try {
      const res = await fetch("/api/lunea/question", { cache: "no-store" });
      const data: QResp = await res.json();
      if (!data.ok) throw new Error(data.error || "failed_question");
      setQ(data.question || "きょうの直感で選んでください。");
      const cs = (data.choices && data.choices.length >= 4 ? data.choices.slice(0, 4) : [
        "A：勢いよく進める",
        "B：まずは発想を広げる",
        "C：手順と基準を決めて進める",
        "D：小さく試して観察する",
      ]);
      setChoices(cs);
    } catch (e: any) {
      setError(e?.message ?? "question_error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
  }, []);

  /* ---------- Q2. 診断の実行 ---------- */
  const runDiagnose = async () => {
    if (!selected) return;
    setDiagLoading(true);
    setError(null);
    try {
      const body: DReq = { choice: selected, theme };
      const res = await fetch("/api/daily/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: DResp = await res.json();
      if (!data.ok) throw new Error(data.error || "failed_diagnose");
      const code = normalizeCode(data.code) || "E";
      setResult({
        code,
        comment: data.comment || "",
        quote: data.quote || "",
      });
      // 触感フィードバック
      (navigator as any)?.vibrate?.(8);
    } catch (e: any) {
      setError(e?.message ?? "diagnose_error");
    } finally {
      setDiagLoading(false);
    }
  };

  /* ---------- Q3. 保存 ---------- */
  const saveResult = async () => {
    if (!result) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        code: result.code,
        comment: result.comment,
        quote: result.quote,
        choice: selected,
        mode: "daily",
        theme, // ← dev で分離できる
      };
      const res = await fetch("/api/daily/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        cache: "no-store",
      });
      const data: SaveResp = await res.json();
      if (!data.ok) throw new Error(data.error || "failed_save");
      // 保存成功 → マイページへ
      window.location.href = "/mypage";
    } catch (e: any) {
      setError(e?.message ?? "save_error");
      setSaving(false);
    }
  };

  /* ---------- 表示ヘルパ ---------- */
  const codeBadge = (c: EV) => {
    const name =
      c === "E" ? "衝動・情熱" :
      c === "V" ? "可能性・夢" :
      c === "Λ" ? "選択・設計" :
      "観測・静寂";
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
        <span className="font-mono">{c}</span>
        <span className="text-xs text-white/70">{name}</span>
      </div>
    );
  };

  /* =========================
     UI
     ========================= */
  return (
    <div className="min-h-[100svh] bg-black text-white">
      <main className="mx-auto max-w-xl px-5 py-8">
        <h1 className="text-xl font-semibold tracking-wide">デイリー診断</h1>
        <p className="text-sm text-white/60 mt-1">1日1問。直感で選んでください。</p>

        {/* エラー */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            うまく読み込めませんでした（{error}）。もう一度お試しください。
          </div>
        )}

        {/* 質問カード */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white/70 text-sm">今日の質問</div>
          <p className="mt-1 text-lg leading-relaxed">
            {loading ? "…生成中" : q}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {choices.map((c, i) => {
              const active = selected === c;
              return (
                <button
                  key={i}
                  type="button"
                  disabled={loading || !!result}
                  onClick={() => setSelected(c)}
                  className={[
                    "w-full text-left rounded-xl px-4 py-3 border transition",
                    active
                      ? "border-white/70 bg-white/15 shadow-[0_0_0_2px_rgba(255,255,255,0.12)_inset]"
                      : "border-white/10 bg-white/5 hover:bg-white/8",
                  ].join(" ")}
                >
                  {c}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchQuestion}
              disabled={loading || diagLoading || saving}
              className="h-10 px-4 rounded-lg border border-white/15 bg-white/10 hover:bg-white/15 active:opacity-90"
            >
              もう一度ひらめきを見る
            </button>

            {!result ? (
              <button
                type="button"
                onClick={runDiagnose}
                disabled={!selected || loading || diagLoading}
                className={[
                  "h-10 px-4 rounded-lg border border-white/10",
                  !selected || loading || diagLoading
                    ? "bg-white/10 text-white/50"
                    : "bg-white text-black active:opacity-90",
                ].join(" ")}
              >
                {diagLoading ? "診断中…" : "結果を見る"}
              </button>
            ) : (
              <button
                type="button"
                onClick={saveResult}
                disabled={saving}
                className={[
                  "h-10 px-4 rounded-lg border border-emerald-400/20",
                  saving
                    ? "bg-emerald-500/30 text-white/70"
                    : "bg-emerald-400 text-black active:opacity-90",
                ].join(" ")}
              >
                {saving ? "保存中…" : "保存する（/mypageへ）"}
              </button>
            )}
          </div>
        </section>

        {/* 結果カード */}
        {result && (
          <section className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/60">今日のコード</div>
              <div className="mt-2 flex items-center gap-3">
                {codeBadge(result.code)}
              </div>
              <p className="mt-3 leading-relaxed">{result.comment}</p>
            </div>

            {!!result.quote && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-white/60">きょうの言葉</div>
                <blockquote className="mt-2 text-base leading-relaxed">
                  “{result.quote}”
                </blockquote>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
