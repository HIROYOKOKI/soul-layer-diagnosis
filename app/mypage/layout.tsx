// app/mypage/layout.tsx
import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* ヘッダー */}
      <AppHeader showBack={false} title="MY PAGE" />

      {/* 本文：中央寄せ・最大幅制限・左右余白 */}
      <main className="mx-auto w-full max-w-[720px] px-4">
        {children}
      </main>
    </>
  );
}
