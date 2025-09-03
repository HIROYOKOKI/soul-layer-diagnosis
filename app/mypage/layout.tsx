// app/mypage/layout.tsx
import type { ReactNode } from "react";

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-black overflow-x-hidden">
<<<<<<< Updated upstream
 
=======
>>>>>>> Stashed changes
      <main className="mx-auto w-full max-w-[720px] px-4 pb-20">
        {children}
      </main>
    </div>
  );
}
