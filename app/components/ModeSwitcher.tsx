// app/components/ModeSwitcher.tsx
"use client";
import { useEffect, useState } from "react";

type Mode = "blue" | "pink";

export default function ModeSwitcher() {
  const [mode, setMode] = useState<Mode>("blue");

  // 初期化（localStorage → <html data-mode> 反映）
  useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("mode")) as Mode | null;
    const initial: Mode = saved === "pink" ? "pink" : "blue";
    setMode(initial);
    document.documentElement.dataset.mode = initial === "pink" ? "pink" : "";
  }, []);

  // 切替時に保存＆反映
  const apply = (m: Mode) => {
    setMode(m);
    localStorage.setItem("mode", m);
    document.documentElement.dataset.mode = m === "pink" ? "pink" : "";
  };

  return (
    <div className="flex gap-4 mt-6">
      <button
        onClick={() => apply("blue")}
        className={`
          flex-1 px-4 py-2 rounded-xl font-bold transition text-black
          bg-[var(--accent)] 
          ${mode === "blue" 
            ? "ring-2 ring-white shadow-[var(--accent-shadow-strong)]" 
            : "shadow-[var(--accent-shadow)] hover:shadow-[var(--accent-shadow-strong)]"}
        `}
      >
        未来モード（青）
      </button>

      <button
        onClick={() => apply("pink")}
        className={`
          flex-1 px-4 py-2 rounded-xl font-bold transition text-black
          /* ピンク時は :root[data-mode=pink] の変数に自動切替 */
          bg-[var(--accent)]
          ${mode === "pink" 
            ? "ring-2 ring-white shadow-[var(--accent-shadow-strong)]" 
            : "shadow-[var(--accent-shadow)] hover:shadow-[var(--accent-shadow-strong)]"}
        `}
      >
        情熱モード（ピンク）
      </button>
    </div>
  );
}
