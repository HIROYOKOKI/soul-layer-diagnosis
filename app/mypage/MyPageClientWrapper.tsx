// app/mypage/MyPageClientWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import MyPageShell from '../../components/layout/MyPageShell';

export default function MyPageClientWrapper({ theme: ssrTheme }: { theme?: string | null }) {
  // 1) SSR値で初期化
  const [theme, setTheme] = useState<string>((ssrTheme ?? 'LIFE').toUpperCase());

  // 2) クライアント側でも /api/theme を no-store で再取得して上書き（確実に反映）
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/theme', { cache: 'no-store' });
        const j = await r.json();
        const scope = (j?.scope ?? 'LIFE') as string;
        setTheme(String(scope).toUpperCase());
      } catch {
        // 失敗時は SSR 値を維持
      }
    })();
  }, []);

  return (
    <MyPageShell
      data={{
        theme: { name: theme, updated_at: null },
      }}
    />
  );
}
