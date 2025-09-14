// components/LuneaBubble.tsx
"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  tone?: "normal" | "accent";
  onDone?: () => void;
  speed?: number; // ms/char
};

export default function LuneaBubble({ text, tone = "normal", onDone, speed = 18 }: Props) {
  const [shown, setShown] = useState("");
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    setShown("");
    let i = 0;
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      i++;
      setShown(text.slice(0, i));
      if (i >= text.length) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        onDone?.();
      }
    }, Math.max(1, speed));

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [text, speed, onDone]);

  return (
    <div className="relative max-w-prose">
      {/* avatar */}
      <div className="absolute -left-12 top-0 size-10 rounded-full bg-[#000814] ring-2 ring-[#0033ff]/60 shadow-[0_0_24px_#0033ff66]" />
      {/* bubble */}
      <div
        className={[
          "rounded-2xl px-4 py-3 leading-7",
          "backdrop-blur-sm border border-white/10",
          "bg-black/60 text-white",
          tone === "accent" ? "shadow-[0_0_24px_#0033ff66] ring-1 ring-[#0033ff]/50" : "shadow-none",
        ].join(" ")}
      >
        <span className="whitespace-pre-wrap">{shown}</span>
      </div>
      {/* tail */}
      <div className="absolute left-2 top-full h-3 w-3 rotate-45 bg-black/60 border-b border-r border-white/10" />
    </div>
  );
}
