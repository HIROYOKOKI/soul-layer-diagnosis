'use client'

import MyPageShell, { Card } from '@/components/layout/MyPageShell'
import DataBridge from '@/components/layout/DataBridge'

export default function Page() {
  return (
    <DataBridge demo={false}>
      <MyPageShell>
        <Card title="テーマ設定">
          <div className="text-sm text-neutral-300">
            （テーマ選択や更新UIをここに実装予定）
          </div>
        </Card>
      </MyPageShell>
    </DataBridge>
  )
}
