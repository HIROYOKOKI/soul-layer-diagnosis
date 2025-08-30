// app/mypage/layout.tsx
import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-[#0B0F1A] overflow-x-hidden">
      {/* ヘッダーは常時表示 */}
      <AppHeader title="MY PAGE" showBack={false} />

      {/* ページ幅と余白を固定（はみ出し防止） */}
      <main className="mx-auto w-full max-w-[720px] px-4 pb-20">
        {children}
      </main>
    </div>
  );
}
