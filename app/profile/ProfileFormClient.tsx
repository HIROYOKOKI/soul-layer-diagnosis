'use client'

import { useState } from 'react'

export default function ProfileFormClient() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
<<<<<<< HEAD
    setError(null); setLoading(true)
=======
    setError(null)
    setLoading(true)
>>>>>>> e65b975 (Result UI仕上げ: Luneaタイプライター／保存→MyPage反映／mypage API)

    const f = new FormData(e.currentTarget)
    const pending = {
      name: String(f.get('name') || ''),
      birthday: String(f.get('birthday') || ''),
      blood: String(f.get('blood') || ''),
      gender: String(f.get('gender') || ''),
      preference: (String(f.get('preference') || '') || null),
    }

    try {
<<<<<<< HEAD
      // 確認画面で表示するため一時保存
=======
      // 確認画面で表示するため一時保存して遷移
>>>>>>> e65b975 (Result UI仕上げ: Luneaタイプライター／保存→MyPage反映／mypage API)
      sessionStorage.setItem('profile_pending', JSON.stringify(pending))
      location.href = '/profile/confirm'
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
        <span>名前</span>
        <input name="name" type="text" required className="px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
      </label>

      <label className="grid gap-1 text-sm">
        <span>誕生日</span>
        <input name="birthday" type="date" required className="px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
      </label>

      <label className="grid gap-1 text-sm">
        <span>血液型</span>
        <select name="blood" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
          <option value="A">A</option><option value="B">B</option>
          <option value="O">O</option><option value="AB">AB</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span>性別</span>
<<<<<<< HEAD
        <select name="gender" className="px-3 py-2 rounded-lg bg白/5 border border-white/10">
=======
        <select name="gender" className="px-3 py-2 rounded-lg bg-white/5 border border-white/10">
>>>>>>> e65b975 (Result UI仕上げ: Luneaタイプライター／保存→MyPage反映／mypage API)
          <option value="Male">男性</option>
          <option value="Female">女性</option>
          <option value="Other">その他</option>
        </select>
      </label>

      <label className="grid gap-1 text-sm">
        <span>恋愛対象（任意）</span>
        <input name="preference" type="text" placeholder="例: 女性 / 男性 / 指定なし"
               className="px-3 py-2 rounded-lg bg-white/5 border border-white/10" />
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button disabled={loading} type="submit"
                className="px-4 py-2 rounded-xl border border-white/20 hover:bg-white/10">
          {loading ? '送信中…' : '確認へ'}
        </button>
        {error && <p className="text-sm text-red-400">エラー：{error}</p>}
      </div>
    </form>
  )
}
