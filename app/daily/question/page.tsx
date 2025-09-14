// app/daily/question/page.tsx
"use client";
import { useEffect, useState } from "react";
import LuneaBubble from "@/components/LuneaBubble";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Choice = { key: EV; label: string };
type Q = { ok: boolean; slot: "morning" | "noon" | "night"; question: string; choices: Choice[]; seed: number };

export default function DailyQuestionPage() {
  const [q, setQ] = useState<Q | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/daily/question", { cache: "no-store" });
      const j = await r.json();
      setQ(j);
    })();
  }, []);

  async function onPick(c: EV) {
    if (!q || sending) return;
    setSending(true);
    setMsg("診断中…");
    const id = `daily-${new Date().toISOString().slice(0, 10)}-${q.slot}`;
    const body = { id, slot: q.slot, choice: c, env: "dev", theme: "dev" };

    const r1 = await fetch("/api/daily/diagnose", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j1 = await r1.json();
    const result = j1.item;

    await fetch("/api/daily/save", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, result }),
    });

    location.href = "/daily/result";
  }

  if (!q)
    return (
      <div className="min-h-[60vh] grid place-items-center bg-black text-white">
        <NeonSymbolGlitch />
      </div>
    );

  return (
    <div className="min-h-[70vh] bg-black text-white px-6 py-10 grid place-items-center">
      <div className="w-full max-w-2xl space-y-8">
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

// ローダを再利用（簡易版）
function NeonSymbolGlitch() {
  return <div className="text-white">Loading…</div>;
}
