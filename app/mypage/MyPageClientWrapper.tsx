// app/mypage/MyPageClientWrapper.tsx  ← 新規
'use client'

import MyPageShell from '@/components/layout/MyPageShell'
import DataBridge from '@/components/layout/DataBridge'

export default function MyPageClientWrapper() {
  return (
    <DataBridge demo={false}>
      <MyPageShell />
    </DataBridge>
  )
}
