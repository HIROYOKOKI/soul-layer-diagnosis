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
    try {
      const arr = raw ? (JSON.parse(raw) as unknown) : null
      setLines(Array.isArray(arr) ? (arr as string[]) : null)
    } catch {
      setLines(null)
    }
  }, [])

  if (!lines) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold tracking-wide">診断結果</h1>
        <p className="mt-3 text-sm text-gray-500">直前の診断結果が見つかりませんでした。</p>
        <div className="mt-5 flex gap-3">
          <button onClick={() => router.push("/profile")} className="px-5 py-2 rounded-2xl bg-black text-white">
            プロフィールへ戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-wide">診断結果</h1>
          <p className="text-sm text-gray-500 mt-1">ルネアによるパーソナルガイダンス</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => router.push("/mypage")} className="px-4 py-2 rounded-2xl border border-gray-300 text-gray-700 hover:bg-gray-100">
            MyPageへ
          </button>
          <button onClick={() => router.push("/profile")} className="px-4 py-2 rounded-2xl bg-black text-white">
            最初からやり直す
          </button>
        </div>
      </header>

      <LuneaResult lines={lines} />
    </div>
  )
}
