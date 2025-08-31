// app/profile/result/ResultClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LuneaResult from "./LuneaResult"

export default function ResultClient() {
  const router = useRouter()
  const [lines, setLines] = useState<string[] | null>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem("profile_result_luneaLines")
    if (!raw) {
      setLines(null)
      return
    }
    try {
      const arr = JSON.parse(raw) as string[]
      setLines(Array.isArray(arr) ? arr : null)
    } catch {
      setLines(null)
    }
  }, [])

  if (lines === null) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">直前の診断結果が見つかりませんでした。</p>
        <div className="mt-4 flex gap-3">
          <button onClick={() => router.push("/profile")} className="px-4 py-2 rounded bg-black text-white">
            プロフィールへ戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">診断結果</h1>
      <LuneaResult lines={lines} />
      <div className="flex gap-3">
        <button onClick={() => router.push("/mypage")} className="px-4 py-2 rounded bg-neutral-900 text-white">
          MyPageへ
        </button>
      </div>
    </div>
  )
}
