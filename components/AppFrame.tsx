"use client";
import { usePathname } from "next/navigation";

export default function AppFrame({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isFull = pathname === "/login"; // /login は全幅
  return <main className={isFull ? "" : "mx-auto max-w-3xl px-4 py-6"}>{children}</main>;
}
