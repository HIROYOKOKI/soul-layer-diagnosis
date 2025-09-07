"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import GlowButton from "@/components/GlowButton"

type Pending = {
  name: string
  birthday: string
  birthTime: string | null        // 任意 ("HH:mm")
  birthPlace: string | null       // 任意 ("City, Country")
  sex: "Male" | "Female" | "Other" | ""            // 任意
  preference: "Female" | "Male" | "Both" | "None" | "Other" | "" | null // 任意
}

export default function ProfileFormClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    const f = new FormData(e.currentTarget)

    const rawPref = String(f.get("preference") || "")
    const pending: Pending = {
      name: String(f.get("name") || ""),
      birthday: String(f.get("birthday") || ""),
      birthTime: (String(f.get("birthTime") || "") || "").trim() === "" ? null : String(f.get("birthTime")),
      birthPlace: (String(f.get("birthPlace") || "") || "").trim() === "" ? null : String(f.get("birthPlace")),
      sex: (String(f.get("sex") || "") as Pending["sex"]),
      preference:
        rawPref === "" ? null : (rawPref as Pending["preference"]),
    }

    try {
      sessionStorage.setItem("profile_pending", JSON.stringify(pending))
      router.push("/profile/confirm")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-xl mx-auto grid gap-4 p-6">
      <h1 className="text-xl font-bold">プロフィール入力</h1>

      <label className="grid gap-1 text-sm">
        <span>ニックネーム</span>
        <input
          name="name"
          type="text"
          required
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
        />
      </label>

      <label className="grid gap-1 text-sm">
        <span>誕生日</span>
        <input
          name="birthday"
          type="date"
          required
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
        />
      </label>

      {/* 任意：出生時間 */}
      <label className="grid gap-1 text-sm">
        <span>出生時間（任意）</span>
        <input
          name="birthTime"
          type="time"
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
        />
      </label>

      {/* 任意：出生地 */}
      <label className="grid gap-1 text-sm">
        <span>出生地（任意）</span>
        <input
          name="birthPlace"
          type="text"
          placeholder="Tokyo, JP / Los Angeles, US など"
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
        />
      </label>

      {/* 任意：性別 */}
      <label className="grid gap-1 text-sm">
        <span>性別（任意）</span>
        <select
          name="sex"
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          defaultValue=""
        >
          <option value="">選択しない</option>
          <option value="Male">男性</option>
          <option value="Female">女性</option>
          <option value="Other">その他</option>
        </select>
      </label>

      {/* 任意：恋愛対象 */}
      <label className="grid gap-1 text-sm">
        <span>恋愛対象（任意）</span>
        <select
          name="preference"
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          defaultValue=""
        >
          <option value="">選択しない</option>
          <option value="Female">女性</option>
          <option value="Male">男性</option>
          <option value="Both">どちらも</option>
          <option value="None">なし</option>
          <option value="Other">その他</option>
        </select>
      </label>

      <div className="flex justify-end pt-4">
        <GlowButton type="submit" variant="primary" size="sm" disabled={loading}>
          {loading ? "送信中…" : "確認へ"}
        </GlowButton>
      </div>

      {error && <p className="text-sm text-red-400 text-right">エラー：{error}</p>}
    </form>
  )
}
