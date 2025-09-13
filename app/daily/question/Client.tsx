"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EV = "E" | "V" | "Λ" | "Ǝ";
type QuestionRes = {
  ok?: boolean;
  // どちらかが来る：
  question?: string;           // 旧
  choices?: EV[];              // 旧
  text?: string;               // 新
  options?: { key: EV; label?: string }[]; // 新
  id?: string;                 // 新
  slot?: number;               // 新
  error?: string;
  data?: any;                  // さらに data ラップされるケースも許容
};
type AnswerReq = { choice: EV; env?: "dev" | "prod"; id?: string; slot?: number };

export default function DailyQuestionClient() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [question, setQuestion] = useState<string>("");
  const [choices, setChoices] = useState<EV[]>([]);
  const [labels, setLabels] = useState<Record<EV, string> | null>(null);
  const [selected, setSelected] = useState<EV | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [qid, setQid] = useState<string | null>(null);
  const [slot, setSlot] = useState<number | null>(null);

  // env を localStorage から復元（既定は prod）
  const [env, setEnv] = useState<"dev" | "prod">("prod");
  useEffect(() => {
    try {
      const saved = localStorage.getItem("ev-env");
      if (saved === "dev" || saved === "prod") setEnv(saved);
      else localStorage.setItem("ev-env", "prod");
    } catch {}
  }, []);

  // 1) 質問の取得（GET）— 形式差を吸収
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
          credentials: "include", // 公開APIでもAuth Cookie同送は無害
          signal: controller.signal,
        });

        // HTMLが返ってきた＝ログインページ等
        const ctype = res.headers.get("content-type") || "";
        const textBody = await res.text();
        if (ctype.includes("text/html")) {
          router.push("/login?return=/daily/question");
          return;
        }

        // JSONとして解釈
        let json: QuestionRes | any = {};
        try { json = JSON.parse(textBody); } catch {}

        if (res.status === 401 || json?.error === "unauthorized") {
          router.push("/login?return=/daily/question");
          return;
        }
        if (!res.ok) throw new Error(`http_${res.status}`);
        if (json?.ok === false) throw new Error(json?.error || "fetch_failed");

        // data ラップを吸収
        const src = (json?.data && typeof json.data === "object") ? json.data : json;

        // 旧 or 新 どちらにも対応して吸い上げ
        const qText: string =
          src.question ?? src.text ?? "";
        const optKeys: EV[] =
          Array.isArray(src.choices) ? src.choices as EV[]
          : Array.isArray(src.options) ? (src.options.map((o: any) => o.key) as EV[])
          : [];

        if (!qText || !Array.isArray(optKeys) || optKeys.length === 0) {
          throw new Error("fetch_failed");
        }

        // ラベル（あれば使う／なければキーをそのまま表示）
        let lab: Record<EV, string> | null = null;
        if (Array.isArray(src.options)) {
          lab = {} as Record<EV, string>;
          for (const o of src.options as any[]) {
            const k = o?.key as EV;
            if (k) lab[k] = o?.label || k;
          }
        }

        if (!alive) return;
        setQuestion(qText);
        setChoices(optKeys);
        setLabels(lab);
        setSelected(null);
        setQid(src.id ?? null);
        setSlot(typeof src.slot === "number" ? src.slot : null);
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

  // 2) 回答の送信（POST）— id/slot を同梱（あれば）
  async function submitAnswer() {
    if (!selected || submitting) return;
    try {
      setErr(null);
      setSubmitting(true);

      const payload: AnswerReq = { choice: selected, env };
      if (qid) payload.id = qid;
      if (slot != null) payload.slot = slot;

      const res = await fetch("/api/daily/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include", // 認証必須
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        router.push("/login?return=/daily/question");
        return;
      }
      if (!res.ok) throw new Error(`answer_failed_${res.status}`);

      router.push("/mypage");
    } catch (e: any) {
      setErr(e?.message || "failed");
    } finally {
      setSubmitting(false);
    }
  }

  // ===== UI =====
  if (loading) return <div className="min-h-dvh grid place-items-center">読み込み中…</div>;

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
              selected === c ? "bg-white/15 border-white/40" : "bg-white/5 border-white/15 hover:bg-white/10"
            }`}
            disabled={submitting}
          >
            {labels?.[c] ?? c}
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
