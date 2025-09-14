// app/daily/result/ResultClient.tsx
"use client";
import { useEffect, useState } from "react";
import LuneaBubble from "@/components/LuneaBubble";

type Item = { code: "E" | "V" | "Λ" | "Ǝ"; comment: string; quote?: string; created_at?: string };

export default function ResultClient() {
  const [item, setItem] = useState<Item | null>(null);
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0=ロード,1=コメント,2=アファ

  useEffect(() => {
    (async () => {
      const r = await fetch("/api/mypage/daily-latest?env=dev", { cache: "no-store" });
      const j = await r.json();
      if (j?.ok && j.item) {
        setItem(j.item);
        setStep(1);
      }
    })();
  }, []);

  if (!item) {
    return (
      <div className="min-h-[60vh] grid place-items-center bg-black">
        <NeonSymbolGlitch />
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] bg-black text-white px-6 py-10 grid place-items-center">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-xs opacity-60">
          {item.created_at && new Date(item.created_at).toLocaleString("ja-JP")}
        </div>

        {step >= 1 && (
          <LuneaBubble text={item.comment} tone="accent" onDone={() => setTimeout(() => setStep(2), 300)} />
        )}

        {step >= 2 && item.quote && (
          <div className="translate-y-1 opacity-90">
            <LuneaBubble text={`《アファメーション》\n${item.quote}`} />
          </div>
        )}

        <div className="pt-4 flex gap-3">
          {step < 2 && (
            <button
              onClick={() => setStep(2)}
              className="px-4 py-2 rounded-xl bg-[#0033ff] text-white hover:opacity-90 transition"
            >
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

/* ===== ローダ（ネオン・シンボル崩壊→再構築） ===== */
function NeonSymbolGlitch() {
  return (
    <div className="relative">
      <div className="text-4xl font-bold tracking-widest [text-shadow:0_0_24px_#0033ff]">EVΛƎ</div>
      <div className="absolute inset-0 animate-pulse blur-sm opacity-70 text-4xl font-bold [color:#0033ff]">EVΛƎ</div>
      <div className="mt-4 h-[2px] w-40 mx-auto bg-gradient-to-r from-transparent via-[#0033ff] to-transparent animate-[scan_1.6s_ease-in-out_infinite]" />
      <style jsx>{`
        @keyframes scan {
          0%,
          100% {
            transform: translateX(-10%);
            opacity: 0.4;
          }
          50% {
            transform: translateX(10%);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
