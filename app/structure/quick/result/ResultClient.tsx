// app/structure/quick/result/ResultClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type EV = "E" | "V" | "Λ" | "Ǝ";

export default function ResultClient() {
  const router = useRouter();
  const [order, setOrder] = useState<EV[] | null>(null);

  useEffect(() => {
    try {
      const raw = typeof window !== "undefined"
        ? sessionStorage.getItem("structure_quick_pending")
        : null;
      const p = raw ? JSON.parse(raw) : null;
      if (!p?.order || !Array.isArray(p.order) || p.order.length !== 4) {
        router.replace("/structure/quick");
      } else {
        setOrder(p.order as EV[]);
      }
    } catch {
      router.replace("/structure/quick");
    }
  }, [router]);

  if (!order) return null;

  return (
    <div className="min-h-screen grid place-items-center bg-black text-white px-5">
      <div className="w-full max-w-md py-10">
        <h1 className="text-center text-xl font-bold mb-6">診断結果（仮）</h1>

        <p className="text-white/80 mb-6">あなたの並び順：{order.join(" → ")}</p>

        <div className="grid gap-3">
          <button
            className="w-full rounded-lg bg-pink-600 py-2 font-bold hover:bg-pink-500"
            onClick={() => router.push("/mypage")}
          >
            マイページへ
          </button>
          <button
            className="w-full rounded-lg border border-white/20 py-2 text-white/90 hover:bg-white/10"
            onClick={() => router.replace("/structure/quick")}
          >
            もう一度やる
          </button>
        </div>
      </div>
    </div>
  );
}
