// app/profile/result/page.tsx
import { Suspense } from "react"
import ResultClient from "./ResultClient"

export const metadata = {
  title: "診断結果 | Soul Layer",
}

export default function Page({
  searchParams,
}: {
  searchParams?: { id?: string }
}) {
  return (
    <Suspense fallback={<div className="p-6">読み込み中…</div>}>
      <ResultClient initialId={searchParams?.id} />
    </Suspense>
  )
}
