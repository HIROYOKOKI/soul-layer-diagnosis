'use client'

import { useEffect, useState } from 'react'
import { formatJP } from '@/components/layout/MyPageShell'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'
type DailyItem = { code?: EV | null; comment?: string | null; created_at?: string | null } | null
type ProfileItem = { fortune?: string | null; personality?: string | null; partner?: string | null; created_at?: string | null } | null

export default function LogClient() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [daily, setDaily] = useState<DailyItem>(null)
  const [profile, setProfile] = useState<ProfileItem>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const [dRes, pRes] = await Promise.all([
          fetch('/api/mypage/daily-latest', { cache: 'no-store' }).then((r) => r.json()),
          fetch('/api/mypage/profile-latest', { cache: 'no-store' }).then((r) => r.json()),
        ])
        if (!cancelled) {
          setDaily(dRes?.item ?? null)
          setProfile(pRes?.item ?? null)
        }
      } catch (e: any) {
        if (!cancelled) setErr(e?.message ?? 'failed_to_load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) return <div className="text-sm text-neutral-400">読み込み中…</div>
  if (err) return <div className="text-sm text-red-400">エラー: {err}</div>

  return (
    <div className="space-y-6 text-sm text-neutral-200">
      {/* デイリー最新 */}
      <section>
        <div className="text-xs uppercase tracking-wider text-neutral-400 mb-2">デイリー（最新）</div>
        {daily ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">コード</span>
              <span className="text-base">{daily?.code ?? '-'}</span>
            </div>
            <div className="mt-2 text-neutral-300 leading-relaxed">
              {daily?.comment ?? 'コメントはありません。'}
            </div>
            <div className="mt-2 text-xs text-neutral-400">更新: {formatJP(daily?.created_at)}</div>
          </div>
        ) : (
          <div className="text-neutral-500">記録がありません。</div>
        )}
      </section>

      {/* プロフィール最新 */}
      <section>
        <div className="text-xs uppercase tracking-wider text-neutral-400 mb-2">プロフィール（最新）</div>
        {profile ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <div>
              <span className="text-neutral-400 mr-2">運勢</span>
              <span className="font-medium">{profile?.fortune ?? '-'}</span>
            </div>
            <div>
              <span className="text-neutral-400 mr-2">性格</span>
              <span className="font-medium">{profile?.personality ?? '-'}</span>
            </div>
            <div>
              <span className="text-neutral-400 mr-2">理想/相性</span>
              <span className="font-medium">{profile?.partner ?? '-'}</span>
            </div>
            <div className="text-xs text-neutral-400">更新: {formatJP(profile?.created_at)}</div>
          </div>
        ) : (
          <div className="text-neutral-500">記録がありません。</div>
        )}
      </section>
    </div>
  )
}
