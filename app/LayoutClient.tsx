// app/LayoutClient.tsx
"use client";

import { usePathname } from "next/navigation";
import AppHeader from "./components/AppHeader";   // ← 相対に修正
import AppFooter from "./components/AppFooter";   // ← 相対に修正

const shouldHide = (p: string) => p === "/intro" || p.startsWith("/intro/");

export default function LayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "/";
  const hide = shouldHide(pathname);

  return (
    <div className="flex min-h-dvh flex-col">
      {!hide && <AppHeader />}
      <main className={!hide ? "flex-1 pt-16 pb-10" : "flex-1"}>{children}</main>
      {!hide && <AppFooter />}
    </div>
  );
}
