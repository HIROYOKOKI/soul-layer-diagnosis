// components/AppHeader.tsx
'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

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
                <path
                  d="M15 6L9 12L15 18"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          )}
        </div>

        {/* 中央：ロゴ（/public/soul-layer-diagnosis.png） */}
        <div className="flex-1 grid place-items-center">
          <Link href="/" className="inline-flex items-center" aria-label="トップへ">
            <Image
              src="/soul-layer-diagnosis.png"
              alt="Soul Layer Diagnosis"
              width={200}
              height={40}
              priority
              className="h-6 sm:h-7 w-auto"
              sizes="(max-width: 640px) 160px, 200px"
            />
            {title && <span className="sr-only">{title}</span>}
          </Link>
        </div>

        {/* 右：ユーザーアイコン（未設定時は /public/icon-512-maskable.svg） */}
        <div className="w-16 flex justify-end">
          <Link href="/mypage" className="relative" aria-label="マイページ">
            {userImage ? (
              <Image
                src={userImage}
                alt="User"
                width={32}
                height={32}
                className="rounded-full object-cover border border-white/20"
              />
            ) : (
              <span className="h-8 w-8 rounded-full overflow-hidden border border-white/20 grid place-items-center bg-white/5">
                <Image
                  src="/icon-512-maskable.svg"
                  alt="User (default)"
                  width={32}
                  height={32}
                  className="object-cover"
                />
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
}
