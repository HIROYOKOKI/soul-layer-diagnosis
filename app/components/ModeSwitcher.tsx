// app/components/ModeSwitcher.tsx
"use client";
import { useState } from "react";

export default function ModeSwitcher() {
  const [mode, setMode] = useState<"blue" | "pink">("blue");

  return (
    <div className="flex gap-4 mt-6">
      {/* ブルーボタン */}
      <button
        onClick={() => setMode("blue")}
        className={`
          flex-1 px-4 py-2 rounded-xl font-bold transition text-black
          bg-[#4fc3ff] 
          ${mode === "blue"
            ? "ring-2 ring-white shadow-[0_0_20px_#4fc3ff,0_0_40px_#4fc3ff]"
            : "shadow-[0_0_10px_#4fc3ff,0_0_20px_#4fc3ff] hover:shadow-[0_0_20px_#4fc3ff,0_0_40px_#4fc3ff]"
          }
        `}
      >
        未来モード（青）
      </button>

      {/* ピンクボタン */}
      <button
        onClick={() => setMode("pink")}
        className={`
          flex-1 px-4 py-2 rounded-xl font-bold transition text-black
          bg-[#ff4fdf] 
          ${mode === "pink"
            ? "ring-2 ring-white shadow-[0_0_20px_#ff4fdf,0_0_40px_#ff4fdf]"
            : "shadow-[0_0_10px_#ff4fdf,0_0_20px_#ff4fdf] hover:shadow-[0_0_20px_#ff4fdf,0_0_40px_#ff4fdf]"
          }
        `}
      >
        情熱モード（ピンク）
      </button>
    </div>
  );
}
