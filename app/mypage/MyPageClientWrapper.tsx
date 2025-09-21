// app/mypage/MyPageClientWrapper.tsx
'use client';

import MyPageShell from '@/components/layout/MyPageShell';
import DataBridge from '@/components/layout/DataBridge';

export default function MyPageClientWrapper() {
  return (
    <DataBridge demo={false}>
      <MyPageShell />
    </DataBridge>
  );
}

