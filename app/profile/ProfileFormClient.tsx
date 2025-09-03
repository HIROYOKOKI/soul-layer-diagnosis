// app/profile/ProfileFormClient.tsx
"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

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
      // 空文字は null 扱い（任意）
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
        <span>ニックネーム</span>
        <input name="name" type="text" required className="px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
      </label>

      <label className="grid gap-1 text-sm">
        <span>誕生日</span>
        <input name="birthday" type="date" required className="px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
      </label>

      <label className="grid gap-1 text-sm">
        <span>血液型</span>
        <select name="blood" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <option value="A">A</option>
          <option value="B">B</option>
          <option value="O">O</option>
          <option value="AB">AB</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span>性別</span>
        <select name="gender" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
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

      <div className="flex items-center gap-3 pt-2">
        <button
          disabled={loading}
          type="submit"
          className="relative inline-flex items-center justify-center rounded-full px-6 py-3
                     bg-gradient-to-r from-cyan-500 to-indigo-500 text-white font-semibold tracking-wide
                     shadow-[0_0_32px_rgba(56,189,248,0.35)]
                     hover:shadow-[0_0_42px_rgba(99,102,241,0.55)]
                     border border-white/10 transition disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? "送信中…" : "確認へ"}
        </button>
        {error && <p className="text-sm text-red-400">エラー：{error}</p>}
      </div>
    </form>
  )
}
