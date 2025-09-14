"use client";

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { usePathname } from "next/navigation";
import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EVΛƎ — Soul Layer Diagnosis",
  description: "EVΛƎ: ソウルレイヤー診断アプリ",
};

// イントロだけ除外
const EXCLUDE_EXACT = ["/", "/welcome"] as const;

function normalizePath(v: unknown): string {
  return typeof v === "string" && v.length > 0 ? v : "/";
}

function shouldHideChrome(pathname?: string | null): boolean {
  const p = normalizePath(pathname);
  return EXCLUDE_EXACT.includes(p as (typeof EXCLUDE_EXACT)[number]);
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = normalizePath(usePathname());
  const hide = shouldHideChrome(pathname);

  return (
    <html lang="ja" className="h-full">
      <body className={[inter.className, "min-h-dvh bg-black text-white antialiased"].join(" ")}>
        <div className="flex min-h-dvh flex-col">
          {!hide && <AppHeader />}
          <main className={!hide ? "flex-1 pt-16 pb-10" : "flex-1"}>{children}</main>
          {!hide && <AppFooter />}
        </div>
      </body>
    </html>
  );
}
