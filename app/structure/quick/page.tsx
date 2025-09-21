'use client'

import MyPageShell, { Card } from '@/components/layout/MyPageShell'
import DataBridge from '@/components/layout/DataBridge'

export default function Page() {
  return (
    <DataBridge demo={false}>
      <MyPageShell>
        <Card title="Quick診断履歴">
          <div className="text-sm text-neutral-300">
            （Quick結果の履歴や詳細表示を追加予定）
          </div>
        </Card>
      </MyPageShell>
    </DataBridge>
  )
}
