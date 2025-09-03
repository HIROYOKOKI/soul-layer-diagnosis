// app/mypage/layout.tsx
import type { ReactNode } from "react";
import AppHeader from "@/components/AppHeader";

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-black overflow-x-hidden">
 
      <main className="mx-auto w-full max-w-[720px] px-4 pb-20">
        {children}
      </main>
    </div>
  );
}
