// components/LuneaBubble.tsx
"use client";
import { useEffect, useRef, useState } from "react";

type Props = {
  text: string;
  tone?: "normal" | "accent";
  onDone?: () => void;
  speed?: number;
  /** 省略時は /lunea.png を使う（/public/lunea.png に配置） */
  avatarSrc?: string;
};

export default function LuneaBubble({
  text,
  tone = "normal",
  onDone,
  speed = 18,
  avatarSrc = "/lunea.png",   // ← ここを固定
}: Props) {
  const [shown, setShown] = useState("");
  const [avatarOk, setAvatarOk] = useState(true);
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
    return () => timerRef.current && window.clearInterval(timerRef.current);
  }, [text, speed, onDone]);

  return (
    <div className="w-full max-w-[min(92vw,42rem)]">
      <div className="flex items-start gap-3">
        {/* avatar */}
        <div className="shrink-0">
          {avatarOk ? (
            <img
              src={avatarSrc}
              alt="Lunea"
              width={40}
              height={40}
              className="h-10 w-10 rounded-full ring-2 ring-[#0033ff]/60 shadow-[0_0_24px_#0033ff66] object-cover"
              onError={() => setAvatarOk(false)}
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#000814] ring-2 ring-[#0033ff]/60 shadow-[0_0_24px_#0033ff66]" />
          )}
        </div>

        {/* bubble */}
        <div
          className={[
            "relative rounded-2xl px-4 py-3 leading-7",
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
