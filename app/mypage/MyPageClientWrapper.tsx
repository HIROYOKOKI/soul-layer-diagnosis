// app/mypage/MyPageClientWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import MyPageShell from '../../components/layout/MyPageShell';

type EV = 'E' | 'V' | 'Λ' | 'Ǝ';

type QuickAPIItem = {
  type_key?: 'EVΛƎ' | 'EΛVƎ' | null;
  type_label?: string | null;
  order_v2?: EV[] | null;
  created_at?: string | null;
} | null;

export default function MyPageClientWrapper({
  theme: ssrTheme,
  quick: ssrQuick,
}: {
  theme?: string | null;
  quick?: QuickAPIItem;
}) {
  // テーマはSSR→CSRで再取得
  const [theme, setTheme] = useState<string>((ssrTheme ?? 'LIFE').toUpperCase());
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/theme', { cache: 'no-store' });
        const j = await r.json();
        setTheme(String(j?.scope ?? 'LIFE').toUpperCase());
      } catch {}
    })();
  }, []);

  return (
    <MyPageShell
      data={{
        theme: { name: theme, updated_at: null },
        quick: ssrQuick
          ? {
              model: ssrQuick.type_key ?? undefined,       // ← ここで model に変換
              label: ssrQuick.type_label ?? undefined,     // ← ラベルも渡せる
              order: ssrQuick.order_v2 ?? undefined,       // ← order_v2 → order に
              created_at: ssrQuick.created_at ?? undefined,
            }
          : undefined,
      }}
    />
  );
}
