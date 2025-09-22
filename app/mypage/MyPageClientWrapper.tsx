// app/mypage/MyPageClientWrapper.tsx
'use client';

import MyPageShell from '../../components/layout/MyPageShell';

export default function MyPageClientWrapper({ theme }: { theme?: string | null }) {
  return (
    <MyPageShell
      data={{
        theme: theme ? { name: theme, updated_at: null } : undefined,
      }}
    />
  );
}
