// app/daily/question/page.tsx
"use client";

import { useEffect, useState } from "react";
import LuneaBubble from "@/components/LuneaBubble";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";
type Choice = { key: EV; label: string };

// /api/daily/question のレスポンス型
type Q = {
  ok: boolean;
  slot: Slot;
  scope: Scope;
  question_id: string;                // e.g. daily-2025-09-20-morning-LOVE
  question: string;
  choices: Choice[];
  seed: number;
  source?: "ai" | "fallback";
};

export default function DailyQuestionPage() {
  const [q, setQ] = useState<Q | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 質問を取得
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/daily/question", { cache: "no-store" });
        if (!r.ok) throw new Error(`/api/daily/question failed (${r.status})`);
        const j: Q = await r.json();
        setQ(j);
      } catch (e: any) {
        setErr(e?.message || "question_fetch_failed");
      }
    })();
  }, []);

  async function onPick(choice: EV) {
    if (!q || sending) return;
    setSending(true);
    setMsg("診断中…");
    setErr(null);

    // APIが返した question_id と scope をそのまま利用
    const body = {
      id: q.question_id,
      slot: q.slot,
      choice,
      scope: q.scope,               // ★ テーマ連動の要
      env: "dev",
      theme: "dev",
    };

    try {
      // 診断生成（必ず POST）
      const r1 = await fetch("/api/daily/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r1.ok) throw new Error(`/api/daily/diagnose failed (${r1.status})`);
      const j1 = await r1.json();
      const result = j1?.item;
      if (!result) throw new Error("diagnose_result_missing");

      // 保存（scope を含めて保存）
      await fetch("/api/daily/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, result }),
      }).catch(() => { /* 保存失敗は致命的でないので握りつぶす */ });

      // 結果へ遷移
      location.href = "/daily/result";
    } catch (e: any) {
      setErr(e?.message || "diagnose_failed");
      setSending(false);
      setMsg(null);
    }
  }

  // エラー時
  if (err) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-black text-white">
        <div className="max-w-md text-center space-y-3">
          <div className="text-red-300">エラー: {err}</div>
          <button
            onClick={() => location.reload()}
            className="mt-2 rounded-lg border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
          >
            再読み込み
          </button>
        </div>
      </div>
    );
  }

  // ローディング時
  if (!q) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-black text-white">
        <NeonSymbolGlitch />
      </div>
    );
  }

  // 表示
  return (
    <div className="min-h-[70vh] bg-black text-white px-6 py-10 grid place-items-center">
      <div className="w-full max-w-2xl space-y-8">
        {/* テーマ・スロット表示 */}
        <div className="text-xs text-white/50">
          テーマ: {q.scope} / スロット: {q.slot}
        </div>

        <LuneaBubble text={q.question} />

        <div className="grid gap-3">
          {q.choices.map((ch) => (
            <button
              key={ch.key}
              onClick={() => onPick(ch.key)}
              className="w-full rounded-2xl border border-white/15 bg-white/5 hover:bg-white/10 px-4 py-3 text-left"
              disabled={sending}
            >
              <span className="opacity-70 mr-2">{ch.key}</span>
              {ch.label}
            </button>
          ))}
        </div>

        {msg && <div className="text-sm opacity-70">{msg}</div>}
      </div>
    </div>
  );
}

// ローダー簡易版
function NeonSymbolGlitch() {
  return <div className="text-white">Loading…</div>;
}
