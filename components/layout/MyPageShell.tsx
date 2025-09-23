// components/layout/MyPageShell.tsx
'use client'

import { useState, useRef, type ReactNode } from 'react'
import { formatJP } from './date'
import ClockJST from './ClockJST'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

export type MyPageData = {
  user?: {
    id?: string | null
    name?: string | null
    displayId?: string | null
    avatarUrl?: string | null
  } | null
  quick?: { model?: 'EVΛƎ' | 'EΛVƎ' | null; label?: string | null; created_at?: string | null } | null
  theme?: { name?: string | null; updated_at?: string | null } | null
  daily?: {
    id?: string | null
    code?: EV | null
    comment?: string | null
    advice?: string | null
    affirm?: string | null
    score?: number | null
    created_at?: string | null
    nextv?: { id: string; label: string }[] | null
    nextv_selected?: string | null
  } | null
  profile?: {
    fortune?: string | null
    personality?: string | null
    partner?: string | null
    created_at?: string | null
  } | null
} | null

const EMPTY_DATA: Readonly<MyPageData> = Object.freeze({})

/* ===== 共通カード ===== */
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
  userId?: string | null   // Supabase user.id を渡す
}

/* ===== 本体レイアウト ===== */
export default function MyPageShell({ data, children, userId }: MyPageShellProps) {
  const d = (data ?? EMPTY_DATA) as MyPageData

  // プロフィール基本情報
  const [avatar, setAvatar] = useState(d?.user?.avatarUrl ?? '')
  const idText = d?.user?.displayId ?? '0001'
  const nameText = d?.user?.name ?? 'Hiro'
  const uid = userId ?? d?.user?.id ?? null

  // Quick 表示
  const model = (d?.quick?.model ?? 'EVΛƎ') as 'EVΛƎ' | 'EΛVƎ'
  const fallback = model === 'EVΛƎ' ? '未来志向型' : '現実思考型'
  const label = d?.quick?.label ?? fallback
  const modelColor = model === 'EVΛƎ' ? '#FF4500' : '#B833F5'

  // テーマ
  const themeName = (d?.theme?.name ?? 'LOVE').toString().toUpperCase()

  // ===== 設定メニュー開閉 =====
  const [menuOpen, setMenuOpen] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const handleAvatarChange = () => {
    fileInputRef.current?.click()
    setMenuOpen(false)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!uid) {
      alert('ログイン情報が確認できません。いったん再ログインしてからお試しください。')
      e.target.value = ''
      return
    }
    setUploading(true)

    const fd = new FormData()
    fd.append('file', file)
    fd.append('user_id', uid)

    try {
      const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
      const json = await res.json()
      if (json?.ok && json.url) {
        setAvatar(json.url)
      } else {
        alert('アップロード失敗: ' + (json?.error ?? '不明なエラー'))
      }
    } catch (err: any) {
      alert('アップロード失敗: ' + (err?.message ?? 'network error'))
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 bg-black min-h-screen font-sans">
      {/* ===== ヘッダー ===== */}
      <div className="mb-4">
        <div className="flex items-baseline gap-3">
          <div className="text-[22px] md:text-3xl font-extrabold text-white tracking-wide">
            MY PAGE
          </div>
          <div className="font-extrabold tracking-wide" style={{ color: modelColor, fontSize: '14px' }}>
            {model}（{label}）
          </div>
        </div>
        <div className="mt-1 text-xs text-neutral-400">あなたの軌跡と、いまを映す</div>
      </div>

      {/* ===== プロフィール行 ===== */}
      <div className="mb-1 flex items-center justify-between">
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
            <div className="text-xs text-neutral-400">ID: {idText}</div>
            <div className="text-lg md:text-xl font-semibold text-white truncate">{nameText}</div>
          </div>
        </div>

        <div className="relative">
          <button
            type="button"
            aria-label="設定"
            className="text-xl text-neutral-300 hover:text-white transition-colors"
            onClick={() => setMenuOpen((v) => !v)}
          >
            ⚙️
          </button>
          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 rounded-md border border-white/10 bg-neutral-900 shadow-lg z-50">
              {/* デバッグ用 uid 表示（落ち着いたら削除OK） */}
              <div className="px-4 py-2 text-[11px] text-neutral-500 border-b border-white/10">
                uid: {uid ?? 'null'}
              </div>
              <button
                type="button"
                onClick={handleAvatarChange}
                disabled={uploading}  // ← uidが無くても押せる。選択後にチェック
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5"
              >
                {uploading ? '画像を変更中…' : '画像を変更'}
              </button>
              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="block w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5"
              >
                閉じる
              </button>
            </div>
          )}
          {/* 非表示のファイル入力 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelect}
          />
        </div>
      </div>

      {/* ===== テーマ ＋ 時計 ===== */}
      <div className="mt-2 mb-6 flex items-center justify-between">
        <div className="text-sm text-white">テーマ: {themeName}</div>
        <ClockJST className="text-xs text-neutral-400 whitespace-nowrap tabular-nums" />
      </div>

      {/* ===== カードグリッド ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* デイリー診断（例） */}
        <Card title="デイリー診断">
          {d?.daily?.comment ? (
            <p className="text-sm text-neutral-200">{d.daily.comment}</p>
          ) : (
            <p className="text-xs text-neutral-500">まだ診断がありません。</p>
          )}
        </Card>

        {/* レーダーチャート枠 */}
        <Card title="構造バランス">
          <div className="h-48 flex items-center justify-center text-neutral-500">
            [Radar Chart Placeholder]
          </div>
        </Card>

        {children}
      </div>
    </div>
  )
}
