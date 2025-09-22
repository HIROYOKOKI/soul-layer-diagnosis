// components/layout/MyPageShell.tsx
'use client'

import { useRef, useState, type ReactNode } from 'react'
import { formatJP } from './date'
import ClockJST from './ClockJST'

type EV = 'E' | 'V' | 'Λ' | 'Ǝ'

export type MyPageData = {
  user?: { name?: string | null; displayId?: string | null; avatarUrl?: string | null } | null
  quick?: { model?: 'EVΛƎ' | 'EΛVƎ' | null; label?: string | null; created_at?: string | null } | null
  theme?: { name?: string | null; updated_at?: string | null } | null
  daily?: { code?: EV | null; comment?: string | null; created_at?: string | null } | null
} | null

const EMPTY_DATA: Readonly<MyPageData> = Object.freeze({})

// ---- 右上⚙️から開く 設定メニュー内で画像変更を実行 ----
function useAvatarMenuUpload(onDone?: (url: string) => void) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [busy, setBusy] = useState(false)

  const trigger = () => {
    inputRef.current?.click()
  }

  const FileInput = ({ userId }: { userId?: string }) => (
    <input
      ref={inputRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!userId) {
          alert('ログインしてから実行してください')
          e.currentTarget.value = ''
          return
        }
        setBusy(true)
        const fd = new FormData()
        fd.append('file', file)
        fd.append('user_id', userId)
        try {
          const res = await fetch('/api/profile/avatar', { method: 'POST', body: fd })
          const json = await res.json()
          if (json?.ok && json.url) {
            onDone?.(json.url)
          } else {
            alert('アップロード失敗: ' + (json?.error ?? 'unknown_error'))
          }
        } catch (err: any) {
          alert('アップロード失敗: ' + (err?.message ?? 'network_error'))
        } finally {
          setBusy(false)
          e.currentTarget.value = '' // 連続で同じファイルを選べるように
        }
      }}
    />
  )

  return { trigger, FileInput, busy }
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

  // アバターは即時反映
  const [avatar, setAvatar] = useState<string>(d?.user?.avatarUrl ?? '')

  // Quick タイトル
  const model = (d?.quick?.model ?? 'EVΛƎ') as 'EVΛƎ' | 'EΛVƎ'
  const modelLabel = d?.quick?.label ?? (model === 'EVΛƎ' ? '未来志向型' : '現実思考型')

  // テーマ
  const themeName = ((d?.theme?.name ?? 'LIFE') as string).toUpperCase()

  // 設定メニューの開閉
  const [menuOpen, setMenuOpen] = useState(false)

  // メニュー内「画像を変更」で使うアップローダ
  const { trigger: triggerUpload, FileInput, busy: uploading } = useAvatarMenuUpload((url) => {
    setAvatar(url)
    setMenuOpen(false)
  })

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-10 bg-black min-h-screen font-sans">
      {/* 中央タイトル */}
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

        {/* 右側：設定メニュー */}
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
            <div
              className="absolute right-0 mt-2 w-56 rounded-xl border border-white/10 bg-neutral-900/95 backdrop-blur shadow-lg z-20"
              onMouseLeave={() => setMenuOpen(false)}
            >
              {/* ヘッダ */}
              <div className="px-4 py-3 border-b border-white/10">
                <div className="text-xs text-neutral-400">プロフィール設定</div>
              </div>

              {/* メニュー項目 */}
              <div className="py-1">
                <button
                  type="button"
                  className={`w-full text-left px-4 py-2 text-sm ${
                    userId ? 'text-white hover:bg-white/5' : 'text-neutral-500 cursor-not-allowed'
                  }`}
                  onClick={() => userId && triggerUpload()}
                >
                  {uploading ? '画像を変更（アップロード中…）' : '画像を変更'}
                </button>

                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5"
                  onClick={() => alert('プロフィール編集は準備中です')}
                >
                  プロフィール編集（準備中）
                </button>

                <button
                  type="button"
                  className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/5"
                  onClick={() => setMenuOpen(false)}
                >
                  閉じる
                </button>
              </div>
            </div>
          )}

          {/* 非表示のファイル入力（メニューから起動） */}
          <FileInput userId={userId} />
        </div>
      </div>

      {/* テーマ行 */}
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
