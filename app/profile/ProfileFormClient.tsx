"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import GlowButton from "@/app/_components/GlowButton"

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
    const pending = {
      name: String(f.get("name") || ""),
      birthday: String(f.get("birthday") || ""),
      blood: String(f.get("blood") || ""),
      gender: String(f.get("gender") || ""),
      preference: rawPref === "" ? null : rawPref,
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
        <span>名前/ニックネーム</span>
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

      <label className="grid gap-1 text-sm">
        <span>血液型</span>
        <select
          name="blood"
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
        >
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="O">O</option>
          <option value="AB">AB</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span>性別</span>
        <select
          name="gender"
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
        >
          <option value="Male">男性</option>
          <option value="Female">女性</option>
          <option value="Other">その他</option>
        </select>
      </label>

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
        </select>
      </label>

      {/* 右寄せコンパクトなGlowButton */}
      <div className="flex justify-end pt-4">
        <GlowButton type="submit" variant="primary" size="sm" disabled={loading}>
          {loading ? "送信中…" : "確認へ"}
        </GlowButton>
      </div>

      {error && <p className="text-sm text-red-400 text-right">エラー：{error}</p>}
    </form>
  )
}
