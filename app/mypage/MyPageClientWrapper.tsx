// app/mypage/MyPageClientWrapper.tsx  ← 新規
'use client'

import MyPageShell from '../components/layout/MyPageShell'   // ← 相対（../components/…）
import DataBridge   from '../components/layout/DataBridge'    // ← 相対

export default function MyPageClientWrapper() {
  return (
    <DataBridge demo={false}>
      <MyPageShell />
    </DataBridge>
  )
}
