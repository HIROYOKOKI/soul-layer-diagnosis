// components/ui/Card.tsx
"use client";

import type { PropsWithChildren, HTMLAttributes } from "react";

type Props = PropsWithChildren<
  HTMLAttributes<HTMLDivElement> & {
    padded?: boolean;   // 余白あり/なし切替
  }
>;

export default function Card({ children, className = "", padded = true, ...rest }: Props) {
  return (
    <div
      className={[
        // はみ出し防止の要点
        "w-full max-w-full overflow-hidden",
        // 見た目（角丸/枠線/薄い背景/影）
        "rounded-2xl border border-white/10 bg-white/[0.03]",
        "shadow-[0_0_40px_rgba(59,130,246,.08)]",
        padded ? "p-4 md:p-5" : "",
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
