// app/profile/result/ResultClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import LuneaResult from "./LuneaResult"

type Props = { initialId?: string }   // ← 受け取り型を定義

export default function ResultClient({ initialId }: Props) {
  const router = useRouter()
  const [lines, setLines] = useState<string[] | null>(null)

  useEffect(() => {
    // Confirm から保存したセッション値を読むだけなので、searchParams フックは不要
    const raw = sessionStorage.getItem("profile_result_luneaLines")
    try {
      const arr = raw ? (JSON.parse(raw) as unknown) : null
      setLines(Array.isArray(arr) ? (arr as string[]) : null)
    } catch {
      setLines(null)
    }
  }, [initialId]) // id 変更時に再読込（将来のために残す/無くしてもOK）

  if (!lines) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">直前の診断結果が見つかりませんでした。</p>
        <button
          onClick={() => router.push("/profile")}
          className="mt-4 px-4 py-2 rounded bg-black text-white"
        >
          プロフィールへ戻る
        </button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">診断結果</h1>
      <LuneaResult lines={lines} />
      <button
        onClick={() => router.push("/mypage")}
        className="px-4 py-2 rounded bg-neutral-900 text-white"
      >
        MyPageへ
      </button>
    </div>
  )
}
