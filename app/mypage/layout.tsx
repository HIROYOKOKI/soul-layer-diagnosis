// app/mypage/layout.tsx
import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";

export default function MyPageLayout({ children }: { children: React.ReactNode }) {
  return (
    <main
      className="
        mx-auto w-full max-w-[720px] px-4
        /* ✅ デバッグ残しを確実にオフ */
        before:content-none
      "
    >
      {children}
    </main>
  );
}
