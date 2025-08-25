"use client";
import { useEffect, useState } from "react";

export default function ModeSwitcher() {
  const [mode, setMode] = useState<"blue" | "pink">("blue");

  // 初期化：保存されてたモードを復元
  useEffect(() => {
    const saved = (localStorage.getItem("mode") as "blue" | "pink") || "blue";
    setMode(saved);
    document.documentElement.dataset.mode = saved === "pink" ? "pink" : "";
  }, []);

  // モードを切り替えて保存
  const apply = (m: "blue" | "pink") => {
    setMode(m);
    localStorage.setItem("mode", m);
    document.documentElement.dataset.mode = m === "pink" ? "pink" : "";
  };

  return (
    <div className="flex gap-2 mt-4">
      <button
        onClick={() => apply("blue")}
        className={`px-4 py-2 rounded-xl font-bold text-black transition
          bg-[#4fc3ff]
          ${mode === "blue" ? "ring-2 ring-white" : "opacity-70"}`}
      >
        未来モード
      </button>
      <button
        onClick={() => apply("pink")}
        className={`px-4 py-2 rounded-xl font-bold text-black transition
          bg-[#ff4fdf]
          ${mode === "pink" ? "ring-2 ring-white" : "opacity-70"}`}
      >
        情熱モード
      </button>
    </div>
  );
}
