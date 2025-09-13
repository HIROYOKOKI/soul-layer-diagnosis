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
  const [submitting, setSubmitting] = useState(false);

  // env を localStorage から復元（既定は prod）
  const [env, setEnv] = useState<"dev" | "prod">("prod");
  // 1) 質問の取得（GET）
useEffect(() => {
  const controller = new AbortController();
  let alive = true;

  (async () => {
    try {
      setErr(null);
      setLoading(true);

      const res = await fetch("/api/daily/question", {
        method: "GET",
        cache: "no-store",
        credentials: "include",           // Auth Cookie を同送
        signal: controller.signal,
      });

      // HTMLが返ってきた＝たぶんログインページ（middlewareで弾かれた等）
      const ctype = res.headers.get("content-type") || "";
      const text = await res.text();
      if (ctype.includes("text/html")) {
        router.push("/login?return=/daily/question");
        return;
      }

      // JSONとして再パース
      let json: any = {};
      try { json = JSON.parse(text); } catch { /* JSONでない → 失敗 */ }

      // 401 は明示遷移
      if (res.status === 401 || json?.error === "unauthorized") {
        router.push("/login?return=/daily/question");
        return;
      }

      // HTTPエラー
      if (!res.ok) {
        throw new Error(`http_${res.status}`);
      }

      // --- 重要: ok が「falseのとき」だけ失敗扱い。未定義は許容 ---
      if (json?.ok === false) {
        throw new Error(json?.error || "fetch_failed");
      }

      // 返却形のゆらぎに強くする（question/choices があれば成功とみなす）
      const q = json?.question ?? json?.data?.question ?? "";
      const ch = (json?.choices ?? json?.data?.choices ?? []) as EV[];

      if (!q || !Array.isArray(ch) || ch.length === 0) {
        throw new Error(json?.error || "fetch_failed");
      }

      if (!alive) return;
      setQuestion(q);
      setChoices(ch);
      setSelected(null);
    } catch (e: any) {
      if (!alive || e?.name === "AbortError") return;
      setErr(e?.message || "failed");
    } finally {
      if (alive) setLoading(false);
    }
  })();

  return () => {
    alive = false;
    controller.abort();
  };
}, [router]);


  // 2) 回答の送信（POST）
  async function submitAnswer() {
    if (!selected || submitting) return;
    try {
      setErr(null);
      setSubmitting(true);
      const res = await fetch("/api/daily/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",            // ← 重要（Auth Cookieを同送）
        body: JSON.stringify({ choice: selected, env } as AnswerReq),
      });
      if (res.status === 401) {
        router.push("/login?return=/daily/question");
        return;
      }
      if (!res.ok) throw new Error(`answer_failed_${res.status}`);

      // 成功 → マイページへ
      router.push("/mypage");
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setSubmitting(false);
    }
  }

  // ===== UI =====

  if (loading) {
    return <div className="min-h-dvh grid place-items-center">読み込み中…</div>;
  }

  if (err) {
    return (
      <div className="min-h-dvh grid place-items-center text-center">
        <div>
          <p className="text-red-400 mb-3">読み込みに失敗しました</p>
          <div className="text-xs text-white/50 mb-3">{err}</div>
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
            aria-pressed={selected === c}
            className={`rounded-xl border px-3 py-2 ${
              selected === c
                ? "bg-white/15 border-white/40"
                : "bg-white/5 border-white/15 hover:bg-white/10"
            }`}
            disabled={submitting}
          >
            {c}
          </button>
        ))}
      </div>

      <button
        onClick={submitAnswer}
        disabled={!selected || submitting}
        className="rounded-xl border border-white/20 bg-white/10 px-4 py-2 disabled:opacity-40"
      >
        {submitting ? "送信中…" : "回答を送信"}
      </button>
    </div>
  );
}
