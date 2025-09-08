"use client"
import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function QuickPageGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const sp = useSearchParams()

  useEffect(() => {
    const raw = sessionStorage.getItem("structure_quick_pending")
    const hasPending = !!raw
    const returnTo = sp.get("return") || "/mypage"
    if (!hasPending) {
      router.replace(returnTo) // ← 直接来た/前提欠如はエラー出さず戻す
    }
  }, [router, sp])

  return <>{children}</>
}
