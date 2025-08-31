// app/profile/result/page.tsx
import ResultClient from "./ResultClient"

export default function Page({
  searchParams,
}: {
  searchParams?: { id?: string }
}) {
  // 必要なら searchParams?.id を Client に渡す
  return <ResultClient initialId={searchParams?.id} />
}
