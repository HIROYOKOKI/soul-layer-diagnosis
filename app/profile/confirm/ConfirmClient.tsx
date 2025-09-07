// app/profile/confirm/ConfirmClient.tsx
"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft } from "lucide-react"
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
  const [backPressed, setBackPressed] = useState(false)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("profile_pending")
      if (raw) setData(JSON.parse(raw))
    } catch {}
  }, [])

  function goBackWithFX() {
    if (backPressed) return
    setBackPressed(true)
    setTimeout(() => {
      router.push("/profile")
    }, 160) // ← 演出が見える最短の待機（120–180ms推奨）
  }

function goNext() {
  try {
    const raw = sessionStorage.getItem("structure_quick_pending")
    const quick = raw ? JSON.parse(raw) : null
    if (!quick?.order || quick.order.length !== 4) {
      // Quick未実施 → Quickへ。完了後に /profile/result へ戻す
      const returnTo = encodeURIComponent("/profile/result")
      router.push(`/structure/quick?return=${returnTo}`)
      return
    }
  } catch {
    const returnTo = encodeURIComponent("/profile/result")
    router.push(`/structure/quick?return=${returnTo}`)
    return
  }
  router.push("/profile/result")
}

  if (!data) {
    return (
      <div className="max-w-xl mx-auto p-6 text-white/70">
        入力内容が見つかりません。
        <button className="underline ml-2" onClick={() => router.push("/profile")}>戻る</button>
      </div>
    )
  }

  const show = (v?: string | null) => (v && v.trim() !== "" ? v : "未入力")
  const showSex  = (v: Pending["sex"]) => (v && v !== "" ? v : "未入力")
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

      {/* 縦並びボタン（戻る→診断） */}
      <div className="space-y-3">
        <button
          onClick={goBackWithFX}
          disabled={backPressed}
          className={[
            "group relative w-full rounded-xl px-4 py-3",
            "border border-white/20 text-white transition",
            "active:scale-[0.99]",
            backPressed
              ? "bg-white/12 shadow-[0_0_16px_rgba(0,255,255,0.25)]"
              : "hover:bg-white/10 hover:shadow-[0_0_12px_rgba(0,255,255,0.18)]",
            "flex items-center justify-center gap-2"
          ].join(" ")}
        >
          <ArrowLeft
            className={[
              "h-4 w-4 transition-transform",
              backPressed ? "-translate-x-1" : "group-active:-translate-x-1"
            ].join(" ")}
          />
          <span>戻る</span>
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
