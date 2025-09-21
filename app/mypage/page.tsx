'use client'

import MyPageShell from '@/components/layout/MyPageShell'
import DataBridge from '@/components/layout/DataBridge'

// ✅ 静的化を禁止
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export default function Page() {
  return (
    <DataBridge demo={false}>
      <MyPageShell />
    </DataBridge>
  )
}
