// components/layout/MyPageShell.tsx
'use client'

import { useState, type ReactNode } from 'react'
import { formatJP } from './date'
import ClockJST from './ClockJST'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

export type MyPageData = {
  user?: { name?: string | null; displayId?: string | null; avatarUrl?: string | null } | null
  // quick は「タイトル用の型名/ラベル」だけ受け取る（並びは渡さない方針）
  quick?: { model?: 'EVΛƎ' | 'EΛVƎ' | null; label?: string | null; created_at?: string | null } | null
  theme?: { name?: string | null; updated_at?: string | null } | null
  daily?: { code?: EV | null; comment?: string | null; created_at?: string | null } | null
} | null

const EMPTY_DATA: Readonly<MyPageData> = Object.freeze({})

// ---- 内蔵：アバターアップロード（/api/profile/avatar にPOST） ----
function AvatarUpload({
  userId,
  onUploaded,
}: {
  userId?: string
  onUploaded?: (url: string) => void
}) {
  const [busy, setBusy] = useState(false)
  if (!userId) return null

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return
    setBusy(true)
    const fd = new FormData()
    fd.append('file', e.target.files[0])
    fd.append('user_id', userId)
    try {
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
      const json = await res.json()
      if (json?.ok && json.url) onUploaded?.(json.url)
      else alert('アップロード失敗: ' + (json?.error ?? 'unknown_error'))
    } catch (err: any) {
      alert('アップロード失敗: ' + (err?.message ?? 'network_error'))
    } finally {
      setBusy(false)
      // 連続選択できるように
      e.currentTarget.value = ''
    }
  }

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer text-xs text-neutral-300 hover:text-white">
      <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 hover:bg-white/10">
        画像を変更
      </span>
      <input type="file" accept="image/*" className="hidden" onChange={onChange} />
      {busy && <span className="text-neutral-400">アップロード中…</span>}
    </label>
  )
}

// ---- 共通カード ----
export function Card({
  title, children, right,
}: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <div className="rounded-2xl shadow-sm border border-white/10 bg-black/90 backdrop-blur p-5 font-sans">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm md:text-base font-semibold text-white tracking-wide">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

export type MyPageShellProps = {
  data?: MyPageData | null
  children?: ReactNode
  /** ログイン中のユーザーID（Supabaseの user.id）。アップロードに必要 */
  userId?: string
}

export default function MyPageShell({ data, children, userId }: MyPageShellProps) {
  const d = (data ?? EMPTY_DATA) as MyPageData

  const name = d?.user?.name ?? 'Hiro'
  const did = d?.user?.displayId ?? '0001'

  // アバターはアップロード後に即時反映したいのでローカルstateで持つ
  const [avatar, setAvatar] = useState<string>(d?.user?.avatarUrl ?? '')

  // ==== Quick の型（タイトルへ反映。未取得時は EVΛƎ/未来志向型 を既定表示） ====
  const model = (d?.quick?.model ?? 'EVΛƎ') as 'EVΛƎ' | 'EΛVƎ'
  const modelLabel = d?.quick?.label ?? (model === 'EVΛƎ' ? '未来志向型' : '現実思考型')

  // テーマ（左側ラベル）
  const themeName = ((d?.theme?.name ?? 'LIFE') as string).toUpperCase()

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 bg-black min-h-screen font-sans">
      {/* 中央タイトル（Quick の型のみ表示） */}
      <div className="mb-2 md:mb-3 flex justify-center">
        <span className="text-[22px] md:text-3xl font-extrabold text-purple-400 tracking-wide">
          {model}（{modelLabel}）
        </span>
      </div>

      {/* プロフィール行 */}
      <div className="mb-1 flex items-center justify-between rounded-none border-0 bg-transparent p-0 shadow-none">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-neutral-800 overflow-hidden flex items-center justify-center">
            {avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatar} alt="avatar" className="h-full w-full object-cover" />
            ) : (
              <span className="text-neutral-500 text-6xl leading-none">🙂</span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-lg md:text-xl font-semibold text-white truncate">{name}</div>
            <div className="text-xs text-neutral-400">ID: {did}</div>
          </div>
        </div>

        {/* 右側：設定アイコン＋画像変更 */}
        <div className="flex items-center gap-3">
          <AvatarUpload userId={userId} onUploaded={(url) => setAvatar(url)} />
          <button type="button" aria-label="設定" className="text-xl text-neutral-300 hover:text-white transition-colors">
            ⚙️
          </button>
        </div>
      </div>

      {/* テーマ行（左：テーマ名のみ／右：JST 現在時刻） */}
      <div className="mt-2 mb-6 flex items-center justify-between">
        <div className="text-sm text-white">テーマ: {themeName}</div>
        <ClockJST className="text-xs text-neutral-400 whitespace-nowrap tabular-nums" />
      </div>

      {/* カードグリッド */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        {/* デイリー（最新） */}
        <Card title="デイリー（最新）">
          {d?.daily?.code ? (
            <>
              <p className="text-sm text-neutral-200 leading-relaxed">
                {d.daily?.comment ?? 'コメントはまだありません。'}
              </p>
              <div className="mt-3 text-xs text-neutral-400">
                {d.daily?.created_at ? `更新: ${formatJP(d.daily.created_at)}` : ''}
              </div>
            </>
          ) : (
            <p className="text-xs text-neutral-500">未取得</p>
          )}
        </Card>

        {/* 構造バランス（レーダー枠） */}
        <Card title="構造バランス">
          <div className="h-48 flex items-center justify-center text-neutral-500">
            [Radar Chart Placeholder]
          </div>
        </Card>

        {/* 次の一歩 */}
        <Card title="次の一歩を選んでください">
          <div className="flex gap-4">
            <button className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 text-white text-sm font-medium border border-neutral-600">
              デイリー診断
              <div className="text-xs text-neutral-400">1問 / 今日のゆらぎ</div>
            </button>
            <button
              className="flex-1 px-4 py-3 rounded-xl bg-neutral-800 text-white text-sm font-medium border border-neutral-600"
              disabled
            >
              診断タイプを選ぶ
              <div className="text-xs text-neutral-400">Weekly / Monthly (予定)</div>
            </button>
          </div>
        </Card>

        {children}
      </div>
    </div>
  )
}
