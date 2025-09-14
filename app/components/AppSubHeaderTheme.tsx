// app/components/AppSubHeaderTheme.tsx
"use client";
import Link from "next/link";

export default function AppSubHeaderTheme({ themeName }: { themeName?: string }) {
  return (
    <div className="pointer-events-none sticky top-16 z-30 border-b border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto max-w-6xl h-10 px-4 sm:px-6 flex items-center text-sm text-white/80">
        <span className="mr-2">現在のテーマ：</span>
        <strong className="mr-3">{themeName ?? "未設定"}</strong>
        <Link
          href="/theme"
          className="pointer-events-auto underline opacity-75 hover:opacity-100"
        >
          変更する
        </Link>
      </div>
    </div>
  );
}
