"use client";

import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";

const EXCLUDE_EXACT = ["/", "/welcome"] as const;

function normalizePath(v: unknown): string {
  return typeof v === "string" && v.length > 0 ? v : "/";
}
function shouldHideChrome(pathname?: string | null): boolean {
  const p = normalizePath(pathname);
  return EXCLUDE_EXACT.includes(p as (typeof EXCLUDE_EXACT)[number]);
}

export default function ClientChrome({ children }: { children: React.ReactNode }) {
  const pathname = normalizePath(usePathname());
  const hide = shouldHideChrome(pathname);

  return (
    <div className="flex min-h-dvh flex-col">
      {!hide && <AppHeader />}
      <main className={!hide ? "flex-1 pt-16 pb-10" : "flex-1"}>{children}</main>
      {!hide && <AppFooter />}
    </div>
  );
}
