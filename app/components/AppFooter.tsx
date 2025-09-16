"use client";

import { usePathname } from "next/navigation";

export default function AppFooter() {
  const pathname = usePathname() || "/";
  const hide = pathname === "/" || pathname.startsWith("/intro");
  if (hide) return null; // ← ホームと/introでは出さない

  return (
    <footer className="border-t border-white/10 bg-black/50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* 既存のフッター内容 */}
      </div>
    </footer>
  );
}
