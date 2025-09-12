// app/daily/question/Client.tsx
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";

type EV = "E" | "V" | "Λ" | "Ǝ";
type DailyQuestion = {
  id: string;
  slot: 1 | 2 | 3;
  text: string;
  options: { key: EV; label: string }[];
  subset?: EV[];
};
type Done = { comment: string; affirmation: string; milestone: 10 | 30 | 90 | null };

const SLOT_LABEL: Record<1 | 2 | 3, string> = { 1: "朝", 2: "昼", 3: "夜" };
const EV_COLOR: Record<EV, string> = {
  E: "text-orange-400",
  V: "text-indigo-300",
  Λ: "text-emerald-300",
  Ǝ: "text-fuchsia-400",
};

// 軽量：必要時のみ読み込む
async function celebrate(n: 10 | 30 | 90) {
  try {
    const { default: confetti } = await import("canvas-confetti");
    confetti({ particleCount: 80, spread: 70, scalar: 0.8, origin: { y: 0.6 } });
  } catch {
    // 依存が無くても UI は継続（静かにスキップ）
  }
}

export default function DailyQuestionClient() {
  const [q, setQ] = useState<DailyQuestion | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const [first, setFirst] = useState<EV | null>(null);
  const [finalK, setFinalK] = useState<EV | null>(null);
  const [changes, setChanges] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<Done | null>(null);

  // 取得：/api/daily/question は DailyQuestion をそのまま返す（Bearer付き）
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr(null);
        const sb = getBrowserSupabase();
        const { data: { session } } = await sb.auth.getSession();
        const token = session?.access_token;

        const res = await fetch("/api/daily/question", {
          cache: "no-store",
          credentials: "same-origin",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });

        if (!res.ok) {
          if (res.status === 401) throw new Error("unauthorized");
          throw new Error("question_failed");
        }

        const j: DailyQuestion = await res.json();
        if (!alive) return;
        setQ(j);
      } catch (e: any) {
        setErr(e?.message || "failed");
      } finally {
        setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const willOverwrite = useMemo(() => {
    if (!q) return false;
    try {
      const s = JSON.parse(localStorage.getItem("daily-answered-ids") || "[]") as string[];
      return s.includes(q.id);
    } catch {
      return false;
    }
  }, [q?.id]);

  const choose = (k: EV) => {
    if (!first) setFirst(k);
    if (finalK && finalK !== k) setChanges((c) => c + 1);
    setFinalK(k);
  };

  // キーボード操作（←→↑↓ で選択移動、Enter/Space で確定）
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = gridRef.current;
    if (!el) return;
    const keys: EV[] = ["E", "V", "Λ", "Ǝ"];
    const handler = (e: KeyboardEvent) => {
      if (!q) return;
      const idx = finalK ? keys.indexOf(finalK) : -1;
      let next = idx;
      if (["ArrowRight", "ArrowDown"].includes(e.key)) next = (idx + 1 + 4) % 4;
      if (["ArrowLeft", "ArrowUp"].includes(e.key)) next = (idx - 1 + 4) % 4;
      if (next !== idx && next >= 0) {
        e.preventDefault();
        choose(keys[next]);
      }
      if ((e.key === "Enter" || e.key === " ") && finalK) {
        e.preventDefault();
        onSubmit();
      }
    };
    el.addEventListener("keydown", handler);
    return () => el.removeEventListener("keydown", handler);
  }, [q, finalK]);

  // マイルストーン祝福（紙吹雪）
  useEffect(() => {
    if (done?.milestone) celebrate(done.milestone);
  }, [done?.milestone]);

  const onSubmit = async () => {
    if (!q || !finalK || submitting) return;
    setSubmitting(true);
    setErr(null);

    // サーバー側で question_id を再計算 → 改竄対策
    const payload = {
      first_choice: first,
      final_choice: finalK,
      changes,
      subset: q.options?.map((o) => o.key) ?? null,
    };

    try {
      const res = await fetch("/api/daily/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload),
      });
      const j = await res.json();
      if (!res.ok || !j?.ok) throw new Error(j?.error || "save_failed");

      // ローカル「回答済みID」マーキング（UIの上書き警告用）
      try {
        const s = JSON.parse(localStorage.getItem("daily-answered-ids") || "[]") as string[];
        if (q.id && !s.includes(q.id)) localStorage.setItem("daily-answered-ids", JSON.stringify([...s, q.id]));
      } catch {}

      setDone({
        comment: j.item?.comment ?? "",
        affirmation: j.item?.quote ?? j.item?.affirmation ?? "",
        milestone: (j.milestone as 10 | 30 | 90 | undefined) ?? null,
      });
    } catch (e: any) {
      // 再送キューへ退避（ローカル）
      try {
        const list = JSON.parse(localStorage.getItem("daily-queue") || "[]");
        localStorage.setItem("daily-queue", JSON.stringify([...(Array.isArray(list) ? list : []), payload]));
      } catch {}
      setErr(e?.message || "save_failed");
    } finally {
      setSubmitting(false);
    }
  };

  const flushQueue = async () => {
    try {
      const list = JSON.parse(localStorage.getItem("daily-queue") || "[]") as any[];
      if (!Array.isArray(list) || list.length === 0) return;
      const head = list[0];
      const res = await fetch("/api/daily/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(head),
      });
      const j = await res.json();
      if (res.ok && j?.ok) {
        localStorage.setItem("daily-queue", JSON.stringify(list.slice(1)));
        setDone({
          comment: j.item?.comment ?? "",
          affirmation: j.item?.quote ?? j.item?.affirmation ?? "",
          milestone: (j.milestone as 10 | 30 | 90 | undefined) ?? null,
        });
        setErr(null);
      }
    } catch {
      // 次回手動再送
    }
  };

  if (loading)
    return <div className="min-h-screen bg-black text-white grid place-items-center">読み込み中…</div>;

  if (err && !q)
    return (
      <div className="min-h-screen bg-black text-white grid place-items-center">
        <div className="text-center space-y-3">
          <div className="text-red-300">読み込みに失敗しました</div>
          <button className="rounded-xl border border-white/20 px-4 py-2" onClick={() => location.reload()}>
            再読み込み
          </button>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-md px-5 py-6 space-y-5">
        <header className="flex items-baseline justify-between">
          <div>
            <h1 className="text-2xl font-bold">DAILY 診断</h1>
            {q && <p className="text-sm text-white/60 mt-1">今日のスロット：{SLOT_LABEL[q.slot]}・ID: {q.id}</p>}
          </div>
          {willOverwrite && (
            <span className="rounded-full border border-amber-400/40 text-amber-300/90 bg-amber-300/10 px-3 py-1 text-xs">
              上書きになります
            </span>
          )}
        </header>

        {q && !done && (
          <section className="rounded-2xl border border-white/12 bg-white/5 p-5 space-y-5">
            <p className="text-lg font-medium">{q.text}</p>

            <div
              ref={gridRef}
              tabIndex={0}
              className="grid grid-cols-2 gap-3 focus:outline-none"
              aria-label="選択肢"
              role="group"
            >
              {q.options.map((o) => {
                const active = finalK === o.key;
                const firstPick = first === o.key;
                return (
                  <button
                    key={o.key}
                    onClick={() => choose(o.key)}
                    className={`rounded-xl border px-4 py-4 text-left transition ${
                      active ? "border-white/70 bg-white/20" : "border-white/15 bg-white/10 hover:bg-white/15"
                    }`}
                    aria-pressed={active}
                    aria-label={`${o.key} ${o.label}`}
                  >
                    <div className={`font-mono text-xl ${EV_COLOR[o.key]}`}>{o.key}</div>
                    <div className="text-sm text-white/80">{o.label}</div>
                    {firstPick && !active && <div className="mt-1 text-[11px] text-white/60">最初に選択</div>}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between text-sm text-white/70">
              <div>変更回数：{changes}</div>
              <div className="text-white/60">Enter で確定</div>
            </div>

            <button
              onClick={onSubmit}
              disabled={!finalK || submitting}
              className="w-full rounded-xl bg-white text-black py-3 font-semibold disabled:opacity-50 disabled:pointer-events-none"
            >
              {submitting ? "送信中…" : "確定して保存"}
            </button>

            {err && (
              <div className="rounded-md border border-red-400/40 bg-red-400/10 px-3 py-2 text-sm text-red-200">
                送信できませんでした。あとで再送します。
                <button onClick={flushQueue} className="ml-2 underline">
                  今すぐ再送
                </button>
              </div>
            )}
          </section>
        )}

        {done && (
          <section className="rounded-2xl border border-white/12 bg-white/5 p-5 space-y-3">
            {done.milestone && (
              <div className="rounded-lg border border-cyan-400/40 bg-cyan-400/10 px-3 py-2 text-sm text-cyan-200">
                {done.milestone} 回目達成！軌跡が濃くなりました。
              </div>
            )}
            <div className="text-sm text-white/60">診断コメント</div>
            <div className="leading-relaxed">{done.comment || "—"}</div>
            <div className="text-sm text-white/60 mt-3">アファメーション</div>
            <blockquote className="text-lg mt-1">“{done.affirmation || "今日は静かに進む"}”</blockquote>

            <div className="pt-2 flex gap-2">
              <a href="/mypage" className="flex-1 rounded-xl border border-white/20 px-4 py-2 text-center hover:bg-white/10">
                マイページへ
              </a>
              <button onClick={() => location.reload()} className="rounded-xl border border-white/20 px-4 py-2 hover:bg-white/10">
                もう一度
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
