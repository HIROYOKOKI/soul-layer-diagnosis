// app/theme/ThemeClient.tsx
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppHeader from "../../components/AppHeader"; // ← 構成に合わせた相対パス

type ThemeKey = "work" | "love" | "future" | "self";

const THEME_LABEL: Record<ThemeKey, string> = {
  work: "仕事",
  love: "恋愛・結婚",
  future: "未来・進路",
  self: "自己理解・性格",
};

const THEME_DESC: Record<ThemeKey, string> = {
  work: "今の役割やキャリアの選び方を見直したい人へ",
  love: "価値観の相性や関係の深め方を知りたい人へ",
  future: "これからの進み方・分岐の判断材料が欲しい人へ",
  self: "自分の傾向を言語化し、日常の選択に活かしたい人へ",
};

export default function ThemeClient() {
  const router = useRouter();
  const [selected, setSelected] = useState<ThemeKey | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // 過去の選択を復元
  useEffect(() => {
    const prev = typeof window !== "undefined" ? sessionStorage.getItem("evae_theme_selected") : null;
    if (prev && ["work", "love", "future", "self"].includes(prev)) {
      setSelected(prev as ThemeKey);
    }
  }, []);

 const handleSelect = (key: ThemeKey) => {
  setSelected(key);
  if (typeof window !== "undefined") {
    sessionStorage.setItem("evae_theme_selected", key);
  }

  // 触感フィードバック（対応端末のみ）
  if (typeof navigator !== "undefined" && typeof (navigator as any).vibrate === "function") {
    (navigator as any).vibrate(10);
  }
};


  const handleNext = async () => {
    if (!selected) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/theme/set", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: selected }),
      });
      if (!res.ok && res.status !== 404) {
        console.warn("Failed to persist theme:", res.status);
      }
    } catch (_e: unknown) {
      // API未実装でもフローは継続
    } finally {
      // ✅ 保存後はマイページへ
      router.push("/mypage");
    }
  };

  return (
    <div className="min-h-[100svh] bg-black text-white">
      {/* ヘッダー：戻る／中央ロゴ／右ユーザーアイコン */}
      <AppHeader title="テーマ選択" />

      <main className="px-5 pt-4 pb-28">
        <h1 className="text-xl font-semibold tracking-wide">テーマ選択</h1>
        <p className="text-white/60 text-sm mt-1">
          今のあなたに一番近いテーマを1つ選んでください。
        </p>

        {/* 4つのカード：モバイル1カラム / md以上2カラム */}
        <section className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          {(["work", "love", "future", "self"] as ThemeKey[]).map((key) => {
            const active = selected === key;
            return (
              <button
                key={key}
                onClick={() => handleSelect(key)}
                aria-pressed={active}
                className={[
                  "w-full text-left rounded-2xl p-4",
                  "border transition-transform",
                  "active:scale-[0.99] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/40",
                  active
                    ? "border-white/60 bg-white/10 shadow-[0_0_0_2px_rgba(255,255,255,0.12)_inset]"
                    : "border-white/10 bg-white/5 hover:bg-white/8",
                ].join(" ")}
              >
                <div className="flex items-start gap-3">
                  {/* 構造シンボル */}
                  <div className="mt-0.5 h-8 w-8 rounded-full bg-white/10 grid place-items-center">
                    <span className="text-sm">
                      {key === "work" && "Λ"}
                      {key === "love" && "V"}
                      {key === "future" && "E"}
                      {key === "self" && "Ǝ"}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-medium">{THEME_LABEL[key]}</h2>
                      {active && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-white/15">
                          選択中
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-white/60 mt-1">{THEME_DESC[key]}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </section>
      </main>

      {/* 固定CTA（セーフエリア対応） */}
      <div className="fixed inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent px-5 pb-[max(16px,env(safe-area-inset-bottom))] pt-3 border-t border-white/10">
        <button
          onClick={handleNext}
          disabled={!selected || submitting}
          className={[
            "w-full h-12 rounded-xl font-medium",
            "border border-white/10",
            !selected || submitting
              ? "bg-white/10 text-white/50"
              : "bg-white text-black active:opacity-90",
          ].join(" ")}
        >
          {submitting ? "保存中…" : "このテーマで進む"}
        </button>
      </div>
    </div>
  );
}
