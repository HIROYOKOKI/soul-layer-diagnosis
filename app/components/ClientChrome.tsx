"use client";

import { usePathname } from "next/navigation";
import AppHeader from "./AppHeader";
import AppFooter from "./AppFooter";

const HIDE = ["/", "/welcome"] as const;
const norm = (v: unknown) => (typeof v === "string" && v.length ? v : "/");

export default function ClientChrome({ children }: { children: React.ReactNode }) {
  const p = norm(usePathname());
  const hide = (HIDE as readonly string[]).includes(p);
  return (
    <div className="flex min-h-dvh flex-col">
      {!hide && <AppHeader />}
      <main className={!hide ? "flex-1 pt-16 pb-10" : "flex-1"}>{children}</main>
      {!hide && <AppFooter />}
    </div>
  );
}
