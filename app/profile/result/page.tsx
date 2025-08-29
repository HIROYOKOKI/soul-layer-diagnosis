import { Suspense } from 'react'
import ResultClient from './ResultClient'

// 実行時描画（SSGしない）
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-75">読み込み中…</div>}>
      <ResultClient />
    </Suspense>
  )
}
