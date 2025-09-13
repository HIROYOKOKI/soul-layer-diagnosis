"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EV = "E" | "V" | "Λ" | "Ǝ";
type QuestionRes = { ok: boolean; question?: string; choices?: EV[]; error?: string };
type AnswerReq = { choice: EV; env?: "dev" | "prod" };

export default function DailyQuestionClient() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [choices, setChoices] = useState<EV[]>([]);
  const [selected, setSelected] = useState<EV | null>(null);

  // ← 例: env を localStorage から（無ければ prod）
  const [env, setEnv] = useState<"dev" | "prod">("prod");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ev-env");
      if (saved === "dev" || saved === "prod") setEnv(saved);
    } catch {}
  }, []);

  // 1) 質問の取得（GET）—— ここに credentials を入れる！
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setErr(null);
        setLoading(true);
        const res = await fetch("/api/daily/question", {
          method: "GET",
          cache: "no-store",
          credentials: "include", // ← ← ← ここが重要
        });
        if (res.status === 401) {
          router.push("/login?return=/daily/question");
          return;
        }
        if (!res.ok) throw new Error(`fetch_failed_${res.status}`);
        const json: QuestionRes = await res.json();
        if (!alive) return;
        if (!json.ok) throw new Error(json.error || "fetch_failed");
        setQuestion(json.question || "");
        setChoices((json.choices as EV[]) || []);
      } catch (e: any) {
        if (alive) setErr(e?.message || "failed");
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [router]);

  // 2) 回答の送信（POST）—— ここにも credentials を入れる！
  async function submitAnswer() {
    if (!selected) return;
    try {
      setErr(null);
      const res = await fetch("/api/daily/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // ← ← ← ここが重要
        body: JSON.stringify({ choice: selected, env } as AnswerReq),
      });
      if (res.status === 401) {
        router.push("/login?return=/daily/question");
        return;
      }
      if (!res.ok) throw new Error(`answer_failed_${res.status}`);
      // 成功後：マイページ等に遷移
      router.push("/mypage");
    } catch (e: any) {
      setErr(e?.message || "failed");
    }
  }

  if (loading) return <div className="min-h-dvh grid place-items-center">読み込み中…</div>;
  if (err) {
    return (
      <div className="min-h-dvh grid place-items-center text-center">
        <div>
          <p className="text-red-400 mb-3">読み込みに失敗しました</p>
          <button
            onClick={() => location.reload()}
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-bold mb-3">DAILY 設問</h1>
      <p className="mb-4">{question}</p>
      <div className="grid grid-cols-2 gap-3 mb-6">
        {choices.map((c) => (
          <button
            key={c}
            onClick={() => setSelected(c)}
            className={`rounded-xl border px-3 py-2 ${
              selected === c
                ? "bg-white/15 border-white/40"
                : "bg-white/5 border-white/15 hover:bg-white/10"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <button
        onClick={submitAnswer}
        disabled={!selected}
        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 disabled:opacity-40"
      >
        回答を送信
      </button>
    </div>
  );
}
