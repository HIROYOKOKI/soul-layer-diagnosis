// app/daily/result/ResultClient.tsx（該当部分だけ差し替え）
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import LuneaBubble from "@/components/LuneaBubble";

type Item = { code: "E"|"V"|"Λ"|"Ǝ"; comment: string; advice?: string; quote?: string; created_at?: string };

export default function ResultClient() {
  const [item, setItem] = useState<Item | null>(null);
  const [step, setStep] = useState<0|1|2|3>(0);

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/mypage/daily-latest?env=dev", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok && j.item) { setItem(j.item); setStep(1); }
    })();
  }, []);

  const hasAdvice = !!(item?.advice && item.advice.trim().length);
  const hasAffirm = !!(item?.quote && item.quote.trim().length);

  const nextAfterComment = useMemo(() => (hasAdvice ? 2 : 3), [hasAdvice]);

  const handleCommentDone = useCallback(() => {
    setTimeout(() => setStep(nextAfterComment), 280);
  }, [nextAfterComment]);

  const handleAdviceDone = useCallback(() => {
    setTimeout(() => setStep(3), 260);
  }, []);

  const handleNext = useCallback(() => {
    setStep((s) => {
      if (s < 1) return 1;
      if (s === 1) return hasAdvice ? 2 : 3;
      if (s === 2) return 3;
      return 3;
    });
  }, [hasAdvice]);

  if (!item) {
    return <div className="min-h-[60vh] grid place-items-center bg-black text-white">Loading…</div>;
  }

  return (
    <div className="min-h-[70vh] bg-black text-white px-5 sm:px-6 py-10 grid place-items-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-xs opacity-60">{item.created_at && new Date(item.created_at).toLocaleString("ja-JP")}</div>

        {step >= 1 && (
          <LuneaBubble text={`《コメント》\n${item.comment}`} tone="accent" onDone={handleCommentDone} />
        )}

        {step >= 2 && hasAdvice && (
          <div className="translate-y-1 opacity-95">
            <LuneaBubble text={`《アドバイス》\n${item.advice}`} onDone={handleAdviceDone} />
          </div>
        )}

        {step >= 3 && hasAffirm && (
          <div className="translate-y-1 opacity-90">
            <LuneaBubble text={`《アファメーション》\n${item.quote}`} />
          </div>
        )}

        <div className="pt-4 flex gap-3">
          {step < 3 && (
            <button onClick={handleNext} className="px-4 py-2 rounded-xl bg-[#0033ff] text-white hover:opacity-90 transition">
              次へ
            </button>
          )}
          <a href="/daily/question" className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/5">
            もう一度
          </a>
        </div>
      </div>
    </div>
  );
}
