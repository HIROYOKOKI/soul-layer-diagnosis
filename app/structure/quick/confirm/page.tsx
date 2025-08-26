// app/structure/quick/confirm/page.tsx
import { Suspense } from 'react'
import ConfirmClient from './ConfirmClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          Loading...
        </div>
      }
    >
      <ConfirmClient />
    </Suspense>
  )
}
