// app/structure/quick/page.tsx
import { Suspense } from "react"
import QuickClient from "./QuickClient"

export const dynamic = "force-dynamic"   // ← プリレンダーしない
export const revalidate = 0              // ← 再検証なし

export default function QuickPage() {
  return (
    <Suspense fallback={null}>
      <QuickClient />
    </Suspense>
  )
}
