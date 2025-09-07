// app/profile/confirm/ConfirmClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import GlowButton from "@/components/GlowButton"

type Pending = {
  name: string
  birthday: string
  birthTime: string | null
  birthPlace: string | null
  sex: "Male" | "Female" | "Other" | "" | null
  preference: "Female" | "Male" | "Both" | "None" | "Other" | "" | null
}

export default function ConfirmClient() {
  const router = useRouter()
  const [data, setData] = useState<Pending | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("profile_pending")
      if (raw) setData(JSON.parse(raw))
    } catch {}
  }, [])

  function goBack() {
    router.push("/profile")
  }
  async function goNext() {
    router.push("/profile/result")
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto p-6 text-white/70">
        入力内容が見つかりません。
        <button className="underline ml-2" onClick={goBack}>戻る</button>
      </div>
    )
  }

  const show = (v?: string | null) => (v && v.trim() !== "" ? v : "未入力")
  const showSex = (v: Pending["sex"]) => (v && v !== "" ? v : "未入力")
  const showPref = (v: Pending["preference"]) => (v && v !== "" ? v : "選択しない")

  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-xl font-bold">確認</h1>

      <div className="rounded-2xl bg-white/[0.03] p-4 text-sm grid gap-2">
        <div><span className="opacity-70">名前 / ニックネーム：</span>{data.name}</div>
        <div><span className="opacity-70">誕生日：</span>{data.birthday}</div>
        <div><span className="opacity-70">出生時間（任意）：</span>{show(data.birthTime)}</div>
        <div><span className="opacity-70">出生地（任意）：</span>{show(data.birthPlace)}</div>
        <div><span className="opacity-70">性別（任意）：</span>{showSex(data.sex)}</div>
        <div><span className="opacity-70">恋愛対象（任意）：</span>{showPref(data.preference)}</div>
      </div>

      {/* 縦並びのボタン */}
      <div className="space-y-3">
        <button
          onClick={goBack}
          className="w-full rounded-xl border border-white/20 px-4 py-3 text-white hover:bg-white/10"
        >
          戻る
        </button>
        <GlowButton
          onClick={goNext}
          variant="primary"
          size="sm"
          className="w-full h-12"
        >
          この内容で診断
        </GlowButton>
      </div>
    </div>
  )
}
