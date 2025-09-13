"use client";

import { useEffect, useState } from "react";
import type React from "react";
import { useRouter } from "next/navigation";
import LuneaBubble from "@/components/LuneaBubble";

type EV = "E" | "V" | "Λ" | "Ǝ";
type Option = { key: EV; label: string };

type Pending = {
  ok: boolean;
  id: string;
  slot: "morning" | "noon" | "night";
  env: "dev" | "prod";
  text: string;
  options: Option[];
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

const isEV = (v: any): v is EV => v === "E" || v === "V" || v === "Λ" || v === "Ǝ";

/** 確認ページ用に設問文から命令表現や注釈を除く */
const toConfirmText = (s: string) => {
  try {
    let t = s;

    // （昼 / 3択）などの注釈を除去
    t = t.replace(/[ 　]*[（(][^）)]*\/\s*\d+択[）)]/g, "");

    // 「〜から選んでください」「選択してください」などの命令表現を除去
    t = t.replace(/、?\s*次の[^。]*?選(?:択)?んでください。?/g, "");
    t = t.replace(/、?\s*どれか[^。]*?選(?:択)?んでください。?/g, "");
    t = t.replace(/から選(?:択)?んでください。?/g, "");
    t = t.replace(/選(?:択)?んでください。?/g, "");

    // 末尾の余分な句読点/空白を整える
    t = t.replace(/[。.\s]+$/g, "").trim();

    return t || s;
  } catch {
    return s;
  }
};

export default function ConfirmClient() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [choice, setChoice] = useState<EV | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 1) セッションから pending を取得
  useEffect(() => {
    try {
      const pRaw = sessionStorage.getItem("daily:pending");
      if (!pRaw) return;
      const p = JSON.parse(pRaw) as Pending;
      if (p?.ok && p?.id) setPending(p);
    } catch {
      /* no-op */
    }
  }, []);

  // 2) /daily/question で選んだ値（pre_choice）または既存の answer から初期選択を復元
  useEffect(() => {
    try {
      const pre = sessionStorage.getItem("daily:pre_choice");
      if (isEV(pre)) {
        setChoice(pre as EV);
        // 残しておくと戻った時も復元できる。消したい場合は次行を有効化
        // sessionStorage.removeItem("daily:pre_choice");
        return;
      }
      const aRaw = sessionStorage.getItem("daily:answer");
      if (aRaw) {
        const a = JSON.parse(aRaw) as Answer;
        if (a?.id === pending?.id && isEV(a?.choice)) setChoice(a.choice);
      }
    } catch {
      /* no-op */
    }
  }, [pending?.id]);

  // 3) 次ページをプリフェッチ
  useEffect(() => {
    router.prefetch("/daily/result");
  }, [router]);

  if (!pending) {
    return (
      <div className="rounded-xl border p-4">
        <p className="text-red-600 text-sm mb-3">直前の質問データが見つかりませんでした。</p>
        <a className="text-indigo-600 underline" href="/daily/question">
          設問ページへ戻る
        </a>
      </div>
    );
  }

  const labelFromChoice = (c: EV | null) =>
    c ? (pending.options.find(o => o.key === c)?.label ?? "") : "";

  const handleConfirm = async () => {
    setError(null);
    if (!choice) {
      setError("選択が見つかりませんでした。設問ページへ戻って選び直してください。");
      return;
    }
    setSubmitting(true);
    try {
      const answer: Answer = {
        id: pending.id,
        slot: pending.slot,
        env: pending.env,
        theme: pending.theme ?? "self",
        choice,
        ts: new Date().toISOString(),
      };
      sessionStorage.setItem("daily:answer", JSON.stringify(answer));
      router.push("/daily/result");
    } catch (e: any) {
      setError(e?.message || "confirm_failed");
    } finally {
      setSubmitting(false);
    }
  };

  // Enterで確定できるように
  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (e) => {
    if (e.key === "Enter") handleConfirm();
  };

  return (
    <div className="space-y-6" onKeyDown={onKeyDown}>
      <div className="text-xs text-gray-500">
        id: {pending.id} / slot: {pending.slot} / env: {pending.env} / ts:{" "}
        {new Date(pending.ts).toLocaleString()}
      </div>

      {/* ルネア吹き出しで質問再掲（命令文は排除） */}
      <div className="rounded-xl border p-4">
        <LuneaBubble key={pending.id} text={toConfirmText(pending.text)} speed={18} />
      </div>

      {/* 選んだ回答の“確認だけ”を表示 */}
      <div className="rounded-2xl border px-4 py-3">
        <div className="text-sm text-gray-500 mb-1">あなたの回答</div>
        {choice ? (
          <div className="text-lg">
            <span className="font-mono mr-2">{choice}</span>
            <span>{labelFromChoice(choice)}</span>
          </div>
        ) : (
          <div className="text-red-600 text-sm">
            まだ選択がありません。<a className="underline" href="/daily/question">設問に戻る</a>
          </div>
        )}
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <div className="flex items-center gap-3">
        <a
          href="/daily/question"
          className="inline-flex items-center justify-center rounded-xl px-4 py-2 border hover:bg-gray-50"
        >
          変更する（戻る）
        </a>
        <button
          onClick={handleConfirm}
          disabled={!choice || submitting}
          className="inline-flex items-center justify-center rounded-xl px-5 py-2.5 border shadow-sm hover:shadow transition disabled:opacity-50"
        >
          {submitting ? "送信中..." : "この内容で回答"}
        </button>
      </div>
    </div>
  );
}
