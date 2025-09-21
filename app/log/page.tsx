'use client'

import MyPageShell, { Card } from '@/components/layout/MyPageShell'
import DataBridge from '@/components/layout/DataBridge'
import LogClient from './LogClient'

export default function Page() {
  return (
    <DataBridge demo={false}>
      <MyPageShell>
        <Card title="診断ログ（最新）">
          <LogClient />
        </Card>
      </MyPageShell>
    </DataBridge>
  )
}
