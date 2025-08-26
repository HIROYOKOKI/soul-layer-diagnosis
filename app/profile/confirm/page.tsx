import { Suspense } from 'react'
import ConfirmClient from './ConfirmClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-black text-white">
          Loading...
        </div>
      }
    >
      <ConfirmClient />
    </Suspense>
  )
}
