// app/components/AppHeader.tsx
"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AppHeader({
  title,
  showBack = true,
  userImage = null,
}: {
  title?: string;
  showBack?: boolean;
  userImage?: string | null;
}) {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur border-b border-white/10">
      <div className="h-14 flex items-center px-3">
        {/* 左：戻る */}
        <div className="w-16">
          {showBack && (
            <button
              onClick={() => router.back()}
              aria-label="戻る"
              className="inline-flex items-center gap-1 text-white/80 hover:text-white active:opacity-80"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="M15 6L9 12L15 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          )}
        </div>

        {/* 中央：ロゴ（内部遷移は Link を使う） */}
        <div className="flex-1 grid place-items-center">
          <Link href="/" className="inline-flex items-center">
            <img src="/evae-logo.svg" alt="EVΛƎ" className="h-5 w-auto" />
            {title && <span className="sr-only">{title}</span>}
          </Link>
        </div>

        {/* 右：ユーザーアイコン（内部遷移は Link を使う） */}
        <div className="w-16 flex justify-end">
          <Link href="/mypage" className="relative">
            {userImage ? (
              <img
                src={userImage}
                alt="User"
                className="h-8 w-8 rounded-full object-cover border border-white/20"
              />
            ) : (
              <div className="h-8 w-8 rounded-full bg-white/15 grid place-items-center text-white/80">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 12c2.2 0 4-1.8 4-4s-1.8-4-4-4-4 1.8-4 4 1.8 4 4 4z" fill="currentColor"/>
                  <path d="M4 20c0-2.7 2.7-5 8-5s8 2.3 8 5v1H4v-1z" fill="currentColor"/>
                </svg>
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
