// app/components/ModeSwitcher.tsx
"use client";

import { useEffect, useState } from "react";

type Mode = "pink" | "blue";

export default function ModeSwitcher() {
  const [mode, setMode] = useState<Mode>("blue");

  // 初期読み込み（localStorage + document）→ useEffect 内
  useEffect(() => {
    try {
      const saved = (localStorage.getItem("mode") as Mode) || "blue";
      setMode(saved);
      document.documentElement.dataset.mode = saved === "pink" ? "pink" : "";
    } catch {}
  }, []);

  // 変更時の反映
  useEffect(() => {
    try {
      localStorage.setItem("mode", mode);
      document.documentElement.dataset.mode = mode === "pink" ? "pink" : "";
    } catch {}
  }, [mode]);

  return (
    <div className="flex items-center gap-2">
      <button
        className="rounded-md border border-white/20 px-3 py-1 text-sm hover:bg-white/10"
        onClick={() => setMode("blue")}
      >
        Blue
      </button>
      <button
        className="rounded-md border border-white/20 px-3 py-1 text-sm hover:bg-white/10"
        onClick={() => setMode("pink")}
      >
        Pink
      </button>
    </div>
  );
}
