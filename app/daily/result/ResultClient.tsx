"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import LuneaBubble from "@/components/LuneaBubble";

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
  const [comment, setComment] = useState<string>("");
  const [quote, setQuote] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // StrictMode での二重実行を防ぐためのフラグ
  const didDiagnose = useRef(false);

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

  // 2) 診断のみ自動実行（保存はボタンで）
  useEffect(() => {
    if (didDiagnose.current) return;
    if (!pending || !answer) {
      setLoading(false);
      return;
    }
    didDiagnose.current = true;

    (async () => {
      setError(null);
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
        setComment(j.item?.comment ?? "");
        setQuote(j.item?.quote ?? "");
      } catch {
        // フォールバック（OpenAI未設定でも最低限表示）
        setComment(`今日のキーは「${answer.choice}」。小さな一歩で流れを作ろう。`);
        setQuote("“The first step sets the tone.”");
      } finally {
        setLoading(false);
      }
    })();
  }, [pending, answer]);

  const handleSave = async () => {
    if (!pending || !answer) return;
    setSaving(true);
    setError(null);
    try {
      const r = await fetch("/api/daily/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: pending.id,
          slot: pending.slot,
          env: pending.env,
          theme: pending.theme ?? answer.theme ?? "self",
          choice: answer.choice,
          comment,
          quote,
          ts: new Date().toISOString(),
        }),
      });
      const j = await r.json();
      if (!r.ok || j?.ok === false) throw new Error(j?.error || "save_failed");
      setSaved(true);
      // マイページの即時反映に使える簡易フラグ
      sessionStorage.setItem(`daily:saved:${pending.id}`, "1");
    } catch (e: any) {
      setError(e?.message || "save_failed");
    } finally {
      setSaving(false);
    }
  };

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

      {/* ルネア吹き出しで診断メッセージ表示 */}
      <div className="rounded-xl border p-4 space-y-4">
        {loading ? (
          <LuneaBubble text="診断中…（数秒）" speed={22} />
        ) : (
          <LuneaBubble key={pending.id} text={comment} speed={16} />
        )}

        {!loading && (
          <div>
            <div className="text-sm text-gray-500 mb-1">アファメーション</div>
            <blockquote className="italic">“{quote}”</blockquote>
          </div>
        )}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={loading || saving || saved}
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 border shadow-sm hover:shadow transition"
        >
          {saved ? "保存済み" : saving ? "保存中..." : "保存"}
        </button>
        <a
          href="/mypage"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 border hover:bg-gray-50"
        >
          マイページへ
        </a>
        <a
          href="/daily/generator"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 border hover:bg-gray-50"
        >
          最初から
        </a>
      </div>
    </div>
  );
}
