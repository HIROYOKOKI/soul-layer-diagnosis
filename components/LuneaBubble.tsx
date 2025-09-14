// components/LuneaBubble.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  tone?: "normal" | "accent";
  onDone?: () => void;      // ← 依存に入れない（refで保持）
  speed?: number;           // ms/char
  avatarSrc?: string;
};

export default function LuneaBubble({
  text,
  tone = "normal",
  onDone,
  speed = 80,
  avatarSrc = "/lunea.png",
}: Props) {
  const [shown, setShown] = useState("");
  const [done, setDone] = useState(false);
  const timerRef = useRef<number | null>(null);
  const onDoneRef = useRef<(() => void) | undefined>(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    // テキストが変わったら最初から
    setShown("");
    setDone(false);
    if (timerRef.current) window.clearInterval(timerRef.current);

    let i = 0;
    const full = String(text ?? "");
    const spd = Math.max(1, speed);

    timerRef.current = window.setInterval(() => {
      i++;
      setShown(full.slice(0, i));
      if (i >= full.length) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        setDone(true);
        onDoneRef.current?.();
      }
    }, spd);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
    // 依存は text と speed のみ。onDone は ref で保持
  }, [text, speed]);

  function skip() {
    if (done) return;
    if (timerRef.current) window.clearInterval(timerRef.current);
    setShown(String(text ?? ""));
    setDone(true);
    onDoneRef.current?.();
  }

  return (
    <div className="w-full max-w-[min(92vw,42rem)]">
      <div className="flex items-start gap-3">
        {/* avatar */}
        <div className="shrink-0">
          <img
            src={avatarSrc}
            alt="Lunea"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full ring-2 ring-[#0033ff]/60 shadow-[0_0_24px_#0033ff66] object-cover"
          />
        </div>

        {/* bubble（タップでスキップ可能） */}
        <div
          onClick={skip}
          className={[
            "relative rounded-2xl px-4 py-3 leading-7 cursor-pointer select-text",
            "backdrop-blur-sm border border-white/10",
            "bg-black/60 text-white break-words",
            tone === "accent" ? "shadow-[0_0_24px_#0033ff66] ring-1 ring-[#0033ff]/50" : "shadow-none",
          ].join(" ")}
        >
          <span className="whitespace-pre-wrap">{shown}</span>
        </div>
      </div>
    </div>
  );
}
