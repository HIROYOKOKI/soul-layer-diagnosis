// app/profile/confirm/ConfirmClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import GlowButton from "@/components/GlowButton"

type Pending = {
  name: string
  birthday: string
  blood: "A" | "B" | "O" | "AB" | ""
  gender: "Male" | "Female" | "Other" | ""
  preference: "Female" | "Male" | "Both" | "" | null
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

  function goBack(){ router.push("/profile") }
  async function goNext(){
    // ここで /api/profile/diagnose へ POST して結果ページへ遷移する想定
    router.push("/profile/result")
  }

  if (!data) return <div className="max-w-xl mx-auto p-6 text-white/70">入力内容が見つかりません。<button className="underline ml-2" onClick={goBack}>戻る</button></div>

  return (
    <div className="max-w-xl mx-auto p-6 space-y-4">
      <h1 className="text-xl font-bold">確認</h1>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm grid gap-2">
        <div><span className="opacity-70">名前/ニックネーム：</span>{data.name}</div>
        <div><span className="opacity-70">誕生日：</span>{data.birthday}</div>
        <div><span className="opacity-70">血液型：</span>{data.blood}</div>
        <div><span className="opacity-70">性別：</span>{data.gender}</div>
        <div><span className="opacity-70">恋愛対象：</span>{data.preference ?? "選択しない"}</div>
      </div>

      <div className="flex justify-between pt-2">
        <button onClick={goBack} className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10">
          戻る
        </button>
        <GlowButton onClick={goNext} variant="primary" size="sm">
          この内容で診断
        </GlowButton>
      </div>
    </div>
  )
}
