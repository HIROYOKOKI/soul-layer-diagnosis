'use client'

import MyPageShell, { Card } from '@/components/layout/MyPageShell'
import DataBridge from '@/components/layout/DataBridge'

export default function Page() {
  return (
    <DataBridge demo={false}>
      <MyPageShell>
        <Card title="診断ログ">
          <div className="text-sm text-neutral-300">
            （ここに保存した診断履歴を一覧表示する予定）
          </div>
        </Card>
      </MyPageShell>
    </DataBridge>
  )
}
