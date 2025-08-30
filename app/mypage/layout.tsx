// app/mypage/layout.tsx
import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";

export default function MyPageLayout({ children }) {
  return (
    <div className="min-h-dvh bg-black overflow-x-hidden">
      <AppHeader />  {/* ← title を渡さない（下で固定ブランド表示に） */}
      <main className="mx-auto w-full max-w-[720px] px-4 pb-20">
        {children}
      </main>
    </div>
  );
}

