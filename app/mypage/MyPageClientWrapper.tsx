// app/mypage/MyPageClientWrapper.tsx
'use client';

import MyPageShell from '../../components/layout/MyPageShell';

type EV = 'E' | 'V' | 'Λ' | 'Ǝ';
type QuickLatest = {
  model?: 'EVΛƎ' | 'EΛVƎ' | null;
  order?: EV[] | null;
  created_at?: string | null;
} | null;

export default function MyPageClientWrapper({
  theme,
  quick,
}: {
  theme?: string | null;
  quick?: QuickLatest;
}) {
  return (
    <MyPageShell
      data={{
        theme: theme ? { name: theme, updated_at: null } : undefined,
        quick: quick
          ? {
              order: (quick.order ?? undefined) as EV[] | undefined,
              // ↓ Shell が参照できるように model を入れる
              // @ts-expect-error: extend shape loosely
              model: quick.model ?? undefined,
              created_at: quick.created_at ?? undefined,
            }
          : undefined,
      }}
    />
  );
}
