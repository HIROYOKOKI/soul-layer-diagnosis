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
  // もし血液型などがある場合はここに追加してOK
}

export default function ConfirmClient() {
  const router = useRouter()
  const [data, setData] = useState<Pending | null>(null)
  const [backPressed, setBackPressed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("profile_pending")
      if (raw) setData(JSON.parse(raw))
    } catch {
      /* noop */
    }
  }, [])

  function goBackWithFX() {
    if (backPressed) return
    setBackPressed(true)
    setTimeout(() => {
      router.push("/profile")
    }, 160) // 演出が見える最短待機
  }

  // ✅ Quick は使わない。ここで診断APIを叩いて /profile/result へ。
  async function goNext() {
    if (!data || loading) return
    setLoading(true)
    setError(null)

    try {
      // API 受け側の想定キーに合わせて最低限マッピング
      const payload = {
        name: data.name,
        birthday: data.birthday,
        gender: data.sex ?? "",
        preference: data.preference ?? "",
        birthTime: data.birthTime ?? "",
        birthPlace: data.birthPlace ?? "",
        // 本番DB汚染防止のため dev テーマで分離（必要なければ削除OK）
        theme: "dev",
      }

      const res = await fetch("/api/profile/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()
      if (!res.ok || !json?.ok) {
        throw new Error(json?.error || "diagnose_failed")
      }

      // 結果を結果ページで読むために保存
      sessionStorage.setItem(
        "profile_diagnose_pending",
        JSON.stringify(json.result)
      )

      // 必ず結果ページへ（Quick は結果ページ下部の導線のみで使用）
      router.push("/profile/result")
    } catch (e: any) {
      setError(e?.message ?? "unknown_error")
    } finally {
      setLoading(false)
    }
  }

  if (!data) {
    return (
      <div className="max-w-xl mx-auto p-6 text-white/70">
        入力内容が見つかりません。
        <button className="underline ml-2" onClick={() => router.push("/profile")}>
          戻る
        </button>
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
          disabled={backPressed || loading}
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
          disabled={loading}
          variant="primary"
          size="sm"
          className="w-full h-12"
        >
          {loading ? "診断中…" : "この内容で診断"}
        </GlowButton>

        {error && (
          <p className="text-rose-400 text-sm text-center">
            エラーが発生しました：{error}（もう一度お試しください）
          </p>
        )}
      </div>
    </div>
  )
}
