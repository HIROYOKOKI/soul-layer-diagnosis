"use client";

import { useEffect, useMemo, useState } from "react";

type EV = "E" | "V" | "Λ" | "Ǝ";

type Pending = {
  ok: boolean;
  id: string;
  slot: "morning" | "noon" | "night";
  env: "dev" | "prod";
  text: string;
  ts: string;
  theme?: string;
};

type Answer = {
  id: string;
  slot: "morning" | "noon" | "night";
  env: "dev" | "prod";
  theme: string;
  choice: EV;
  ts: string;
};

type DiagnoseResp = {
  ok: boolean;
  item?: {
    id?: string;
    slot?: Pending["slot"];
    env?: Pending["env"];
    theme?: string;
    code?: EV;
    comment?: string;
    quote?: string; // アファメーション的な短文
  };
  error?: string;
};

export default function ResultClient() {
  const [pending, setPending] = useState<Pending | null>(null);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [comment, setComment] = useState<string | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 1) セッションから取り出し（同一タブ前提）
  useEffect(() => {
    try {
      const p = sessionStorage.getItem("daily:pending");
      const a = sessionStorage.getItem("daily:answer");
      if (p) setPending(JSON.parse(p));
      if (a) setAnswer(JSON.parse(a));
    } catch {
      /* no-op */
    }
  }, []);

  const metaLine = useMemo(() => {
    if (!pending) return "";
    const when = pending.slot === "morning" ? "朝" : pending.slot === "noon" ? "昼" : "夜";
    return `id: ${pending.id} / ${when} / env: ${pending.env}`;
  }, [pending]);

  // 2) 診断 → 保存（初回のみ）
  useEffect(() => {
    const run = async () => {
      if (!pending || !answer) { setLoaded(true); return; }
      setError(null);

      let c = "";
      let q = "";

      // 診断API（OpenAI未設定でも後続フォールバックで表示可）
      try {
        const r = await fetch("/api/daily/diagnose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: pending.id,
            slot: pending.slot,
            env: pending.env,
            theme: pending.theme ?? answer.theme ?? "self",
            choice: answer.choice,
          }),
        });
        const j = (await r.json()) as DiagnoseResp;
        if (!j.ok) throw new Error(j.error || "diagnose_failed");
        c = j.item?.comment || "";
        q = j.item?.quote || "";
      } catch {
        // フォールバック（最低限表示）
        c = `今日のキーは「${answer.choice}」。小さな一歩で流れを作ろう。`;
        q = "“The first step sets the tone.”";
      }

      setComment(c);
      setQuote(q);

      // 保存API（失敗しても画面は続行）
      try {
        setSaving(true);
        await fetch("/api/daily/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: pending.id,
            slot: pending.slot,
            env: pending.env,
            theme: pending.theme ?? answer.theme ?? "self",
            choice: answer.choice,
            comment: c,
            quote: q,
            ts: new Date().toISOString(),
          }),
        });
      } catch {
        /* no-op */
      } finally {
        setSaving(false);
        setLoaded(true);
      }
    };

    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pending?.id]);

  // セッション未設定ガード
  if (!pending || !answer) {
    return (
      <div className="rounded-xl border p-4 space-y-3">
        <p className="text-red-600 text-sm mb-2">直前の質問/回答データが見つかりませんでした。</p>
        <a href="/daily/generator" className="text-indigo-600 underline">生成ページへ戻る</a>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-xs text-gray-500">{metaLine}</div>

      <div className="rounded-xl border p-4">
        <div className="text-sm text-gray-500 mb-1">あなたの選択</div>
        <div className="text-lg">
          <span className="font-mono mr-2">{answer.choice}</span>
          <span>
            {answer.choice === "E" ? "意志" :
             answer.choice === "V" ? "感受" :
             answer.choice === "Λ" ? "構築" : "反転"}
          </span>
        </div>
      </div>

      {!loaded ? (
        <div className="rounded-xl border p-4">診断中…（数秒）</div>
      ) : (
        <>
          <div className="rounded-xl border p-4 space-y-2">
            <div className="text-sm text-gray-500">コメント</div>
            <p className="leading-relaxed">{comment}</p>
          </div>
          <div className="rounded-xl border p-4">
            <div className="text-sm text-gray-500 mb-1">アファメーション</div>
            <blockquote className="italic">“{quote}”</blockquote>
          </div>

          <div className="flex items-center gap-3">
            <a href="/mypage" className="inline-flex items-center justify-center rounded-xl px-4 py-2 border hover:bg-gray-50">
              マイページへ
            </a>
            <a href="/daily/generator" className="inline-flex items-center justify-center rounded-xl px-4 py-2 border hover:bg-gray-50">
              最初から
            </a>
            {saving && <span className="text-xs text-gray-400">保存中…</span>}
          </div>
        </>
      )}
    </div>
  );
}
