'use client'

import MyPageShell from '@/components/layout/MyPageShell'
import DataBridge from '@/components/layout/DataBridge'

export default function Page() {
  return (
    <DataBridge demo={false}>
      <MyPageShell />
    </DataBridge>
  )
}
