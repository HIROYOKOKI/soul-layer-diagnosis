// app/theme/confirm/ConfirmClient.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type ThemeKey = "work" | "love" | "future" | "self";
const LABEL: Record<ThemeKey, string> = {
  work: "仕事",
  love: "恋愛・結婚",
  future: "未来・進路",
  self: "自己理解・性格",
};
const DESC: Record<ThemeKey, string> = {
  work: "今の役割やキャリアの選び方を見直したい人へ",
  love: "価値観の相性や関係の深め方を知りたい人へ",
  future: "これからの進み方・分岐の判断材料が欲しい人へ",
  self: "自分の傾向を言語化し、日常の選択に活かしたい人へ",
};

export default function ConfirmClient() {
  const router = useRouter();
  const [selected, setSelected] = useState<ThemeKey | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const v = sessionStorage.getItem("evae_theme_selected");
    if (v && (["work", "love", "future", "self"] as string[]).includes(v)) {
      setSelected(v as ThemeKey);
    } else {
      // 選択がなければ戻す
      router.replace("/theme");
    }
  }, [router]);

  const summary = useMemo(() => {
    if (!selected) return null;
    return { key: selected, label: LABEL[selected], desc: DESC[selected] };
  }, [selected]);

  const saveAndGo = async () => {
    if (!summary) return;
    try {
      const res = await fetch("/api/theme/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: summary.key }),
      });
      if (!res.ok && res.status !== 404) {
        console.warn("Failed to persist theme:", res.status);
      }
    } catch {
      // 失敗してもUX優先で続行
    } finally {
      router.push("/mypage");
    }
  };

  if (!summary) return null;

  return (
    <div className="min-h-[100svh] bg-black text-white">
      <main className="px-5 pt-4 pb-28">
        <h1 className="text-xl font-semibold tracking-wide">選択の確認</h1>
        <p className="text-white/60 text-sm mt-1">この内容で保存してよければ「保存する」を押してください。</p>

        <section className="mt-6">
          <div className="rounded-2xl border border-white/15 bg-white/5 p-4">
            <div className="text-sm text-white/60">あなたの選択</div>
            <div className="mt-1 text-lg font-medium">{summary.label}</div>
            <div className="mt-2 text-sm text-white/60">{summary.desc}</div>
          </div>

          <button
            type="button"
            onClick={() => router.push("/theme")}
            className="mt-4 text-sm underline text-white/70 hover:text-white"
          >
            変更する（テーマ選択に戻る）
          </button>
        </section>
      </main>

      {/* 下部：保存 */}
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 border-t border-white/10">
        <button
          onClick={saveAndGo}
          className="w-full h-12 rounded-xl font-medium bg-white text-black active:opacity-90"
        >
          保存する（MYPAGEへ）
        </button>
      </div>
    </div>
  );
}
