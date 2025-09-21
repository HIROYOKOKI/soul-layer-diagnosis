'use client'

import MyPageShell from '@/components/layout/MyPageShell'
import DataBridge from '@/components/layout/DataBridge'

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function Page() {
  return (
    <DataBridge demo={false}>
      <MyPageShell />
    </DataBridge>
  )
}
