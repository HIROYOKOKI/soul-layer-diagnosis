// app/daily/question/page.tsx
'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import LuneaBubble from "@/components/LuneaBubble";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Slot = "morning" | "noon" | "night";
type Scope = "WORK" | "LOVE" | "FUTURE" | "LIFE";
type Choice = { key: EV; label: string };

// /api/daily/question のレスポンス（互換用に緩め）
type QApi = {
  ok: boolean;
  slot?: Slot;
  scope?: Scope;
  theme?: Scope;                // 互換
  question_id?: string;
  question?: string;
  choices?: Array<{ key?: EV; id?: EV; label?: string }>;
  seed?: number;
};

type Q = {
  ok: boolean;
  slot: Slot;
  scope: Scope;
  question_id: string;
  question: string;
  choices: Choice[];
  seed: number;
  source?: "ai" | "fallback";
};

/* ===== クライアント側フォールバック ===== */
const FALLBACK: Record<Slot, Choice[]> = {
  morning: [
    { key: "E", label: "直感で素早く動く" },
    { key: "V", label: "理想のイメージから始める" },
    { key: "Λ", label: "条件を決めて選ぶ" },
    { key: "Ǝ", label: "一拍置いて様子を見る" },
  ],
  noon: [
    { key: "E", label: "勢いで一歩進める" },
    { key: "V", label: "可能性を広げる選択をする" },
    { key: "Λ", label: "目的に沿って最短を選ぶ" },
  ],
  night: [
    { key: "Ǝ", label: "今日は観測と整理に徹する" },
    { key: "V", label: "明日に向けて静かに構想する" },
  ],
};

const NEED = (s: Slot) => (s === "morning" ? 4 : s === "noon" ? 3 : 2);

/* JST 現在スロット（確実に Asia/Tokyo で計算） */
function getJstSlot(): Slot {
  const h = Number(
    new Intl.DateTimeFormat("ja-JP", {
      timeZone: "Asia/Tokyo",
      hour: "numeric",
      hour12: false,
    }).format(new Date())
  );
  if (h >= 5 && h < 12) return "morning";
  if (h >= 12 && h < 18) return "noon";
  return "night";
}

export default function DailyQuestionPage() {
  const router = useRouter();
  const [q, setQ] = useState<Q | null>(null);
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // 質問を取得（テーマとスロットをクライアントで正規化）
  useEffect(() => {
    (async () => {
      try {
        // 1) MyPage と同じテーマを先に取得して固定
        let scope: Scope = "LOVE";
        try {
          const rt = await fetch("/api/theme", { cache: "no-store" });
          const jt = await rt.json();
          const s = String(jt?.scope ?? jt?.theme ?? "LOVE").toUpperCase();
          if (["WORK", "LOVE", "FUTURE", "LIFE"].includes(s)) scope = s as Scope;
        } catch { /* LOVE のまま */ }

        // 2) サーバ質問API（内容は使う／slot/themeは無視）
        const r = await fetch("/api/daily/question", { cache: "no-store" });
        if (!r.ok) throw new Error(`/api/daily/question failed (${r.status})`);
        const j = (await r.json()) as QApi;

        // 3) スロットはクライアントで再判定
        const slot = getJstSlot();
        const need = NEED(slot);

        // 4) choices を互換正規化（key or id → key）
        let choices: Choice[] = Array.isArray(j.choices)
          ? j.choices
              .map((c) => ({
                key: ((c.key ?? c.id) as EV) ?? undefined,
                label: typeof c.label === "string" ? c.label.trim() : "",
              }))
              .filter((c): c is Choice => Boolean(c.key && c.label))
          : [];

        // 5) 足りない分は必ず補完（最終的に 2〜4 件にする）
        if (choices.length < need) {
          const have = new Set(choices.map((c) => c.key));
          for (const fb of FALLBACK[slot]) {
            if (choices.length >= need) break;
            if (!have.has(fb.key)) choices.push(fb);
          }
        }
        if (choices.length === 0) choices = FALLBACK[slot].slice(0, need);
        if (choices.length > need) choices = choices.slice(0, need);

        // 6) 質問文（空ならスロット別デフォルト）
        const question =
          (j.question ?? "").trim() ||
          (slot === "morning"
            ? "今のあなたに必要な最初の一歩はどれ？"
            : slot === "noon"
            ? "このあと数時間で進めたい進路は？"
            : "今日はどんな締めくくりが心地いい？");

        // 7) 状態確定（theme/scope と slot はクライアント決定値）
        setQ({
          ok: true,
          slot,
          scope,
          question_id: j.question_id || crypto.randomUUID(),
          question,
          choices,
          seed: typeof j.seed === "number" ? j.seed : 0,
          source: choices === FALLBACK[slot] ? "fallback" : "ai",
        });
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

    // ★ 送信は seed / choiceId / scope|theme を確実に送る
    const body = {
      id: q.question_id,
      seed: q.seed,                 // あるなら送る
      slot: q.slot,
      choice,                       // 旧API互換
      choiceId: choice,             // 新API互換
      scope: q.scope,               // 旧フィールド名
      theme: q.scope,               // 新フィールド名（同じ値）
      env: "dev",   
    };

    try {
      const r1 = await fetch("/api/daily/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!r1.ok) throw new Error(`/api/daily/diagnose failed (${r1.status})`);

      const payload = await r1.json();
     console.log("DIAGNOSE RAW >>>", payload);


      // ★ 受け取りは item / result / data / 直下 の順に拾う
      const received =
        payload?.item ?? payload?.result ?? payload?.data ?? payload;

      if (!received || typeof received.comment !== "string") {
        throw new Error("diagnose_result_missing");
      }

      // 保存はそのまま（失敗は致命でないので握る）
      fetch("/api/daily/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...body, result: received }),
      }).catch(() => {});

    // ★ 直前の生成結果を画面に受け渡し
     if (typeof window !== "undefined") {
        sessionStorage.setItem("last_daily_result", JSON.stringify(received));
      }
      // 結果ページへ
      router.push("/daily/result");
    } catch (e: any) {
      setErr(e?.message || "diagnose_failed");
      setSending(false);
      setMsg(null);
    }
  }

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

  if (!q) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-black text-white">
        <NeonSymbolGlitch />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-black text-white px-6 py-10 grid place-items-center">
      <div className="w-full max-w-2xl space-y-8">
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

function NeonSymbolGlitch() {
  return <div className="text-white">Loading…</div>;
}
