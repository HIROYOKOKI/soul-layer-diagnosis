// app/profile/result/page.tsx
import { Suspense } from "react"
import ResultClient from "./ResultClient"

export default function Page({
  searchParams,
}: { searchParams?: { id?: string } }) {
  return (
    <Suspense fallback={<div className="p-6">読み込み中…</div>}>
      <ResultClient initialId={searchParams?.id} />
    </Suspense>
  )
}
