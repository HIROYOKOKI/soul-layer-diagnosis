// app/profile/result/page.tsx
import { Suspense } from 'react'
import ResultClient from './ResultClient'

export const dynamic = 'force-dynamic'

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <ResultClient />
    </Suspense>
  )
}
