// app/mypage/MyPageClientWrapper.tsx
'use client';

import { useEffect, useState } from 'react';
import MyPageShell from '../../components/layout/MyPageShell'; // ← ここが正解（../../）

type EV = 'E' | 'V' | 'Λ' | 'Ǝ';
type QuickLatest = {
  model?: 'EVΛƎ' | 'EΛVƎ' | null;
  order?: EV[] | null;
  created_at?: string | null;
} | null;

export default function MyPageClientWrapper({
  theme: ssrTheme,
  quick: ssrQuick,
}: {
  theme?: string | null;
  quick?: QuickLatest;
}) {
  // —— テーマは SSR 値で即表示し、CSR でもう一度 /api/theme を取って上書き（確実反映）
  const [theme, setTheme] = useState<string>((ssrTheme ?? 'LIFE').toUpperCase());

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/theme', { cache: 'no-store' });
        const j = await r.json();
        const scope = (j?.scope ?? 'LIFE') as string;
        setTheme(scope.toUpperCase());
      } catch {
        /* noop: SSR値を維持 */
      }
    })();
  }, []);

  return (
    <MyPageShell
      data={{
        theme: { name: theme, updated_at: null },
        quick: ssrQuick
          ? {
              order: (ssrQuick.order ?? undefined) as EV[] | undefined,
              // @ts-expect-error: MyPageShell 側の拡張用に model を素通し
              model: ssrQuick.model ?? undefined,
              created_at: ssrQuick.created_at ?? undefined,
            }
          : undefined,
      }}
    />
  );
}
