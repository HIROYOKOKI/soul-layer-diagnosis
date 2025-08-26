// app/profile/result/page.tsx
import { Suspense } from 'react'
import ResultClient from './ResultClient'

export const dynamic = 'force-dynamic'  // SSGを避ける

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ResultClient />
    </Suspense>
  )
}
