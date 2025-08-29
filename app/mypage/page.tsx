// app/mypage/page.tsx
'use client'

import { useEffect, useMemo, useState } from 'react'

type DailyRow = {
  id: string
  user_id: string | null
  code: string
  navigator: string | null
  mode: string | null
  choice: string | null
  theme: string | null
  created_at: string
}

type ThemeResp = { ok: boolean; theme: string; setAt?: string }
type ListResp  = { ok: boolean; data: DailyRow[]; error?: string }

// 表示用：記号の正規化
function normalizeCode(code?: string) {
  const x = (code || '').trim()
  if (x === '∃' || x === 'ヨ') return 'Ǝ'
  if (x === 'A') return 'Λ'
  return (['E', 'V', 'Λ', 'Ǝ'].includes(x) ? x : '') as 'E' | 'V' | 'Λ' | 'Ǝ' | ''
}

/* =========================
   FLAT POP ICON (単色カラフル)
   ========================= */
type TypeKey = 'E' | 'V' | 'Λ' | 'Ǝ'
const FLAT_BG: Record<TypeKey, string> = {
  E: '#f15a24',  // オレンジ
  V: '#44ffff',  // シアン
  Λ: '#fcee21',  // イエロー
  Ǝ: '#812b8c',  // パープル
}
// 文字色（見やすさ優先：紫のみ白、それ以外は黒）
const FLAT_FG: Record<TypeKey, string> = { E: '#111', V: '#111', Λ: '#111', Ǝ: '#fff' }
const BADGE_RADIUS_PX = 12
const BADGE_SIZE = 40

function FlatIcon({ type }: { type: TypeKey }) {
  const bg = FLAT_BG[type]
  const fg = FLAT_FG[type]
  return (
    <div
      aria-label={`構造 ${type}`}
      style={{
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        borderRadius: BADGE_RADIUS_PX,
        background: bg,
        display: 'grid',
        placeItems: 'center',
        color: fg,
        fontWeight: 900,
        letterSpacing: '0.02em',
        // シンプルに軽い影だけ
        boxShadow: '0 2px 6px rgba(0,0,0,.25)',
      }}
    >
      {type}
    </div>
  )
}

async function fetchJSON<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: 'no-store' })
  const ct = res.headers.get('content-type') || ''
  if (!ct.includes('application/json')) {
    const text = await res.text().catch(() => '')
    throw new Error(text || `HTTP ${res.status}`)
  }
  return (await res.json()) as T
}

export default function MyPage() {
  const [rows, setRows] = useState<DailyRow[] | null>(null)
  const [theme, setTheme] = useState<string>('—')
  const [themeSetAt, setThemeSetAt] = useState<string>('')
  const [navName, setNavName] = useState<string>('—')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    try {
      const v = sessionStorage.getItem('daily_character') || 'ルネア'
      setNavName(v)
    } catch {}

    const run = async () => {
      try {
        const [listJson, themeJson] = await Promise.all([
          fetchJSON<ListResp>('/api/daily/list?limit=30'),
          fetchJSON<ThemeResp>('/api/theme/get'),
        ])
        if (!listJson.ok) throw new Error(listJson.error || 'list_failed')
        setRows(listJson.data)
        setTheme(themeJson.theme || '仕事')
        setThemeSetAt(themeJson.setAt || '')
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : typeof e === 'string' ? e : 'failed'
        setError(`読み込みに失敗しました: ${msg}`)
      } finally {
        setLoading(false)
      }
    }

    run()
  }, [])

  const latestCode = useMemo(() => normalizeCode(rows?.[0]?.code), [rows])

  const luneaClosing = (code: string) => {
    switch (code) {
      case 'E':
        return '今日は“勢い”が鍵。小さな一歩をもう一つ踏み出してみよう。'
      case 'V':
        return '視野を広げる日。選択肢を3つ書き出して、直感で面白い方へ。'
      case 'Λ':
        return '決めることで世界は動く。締め切りを自分にプレゼントしよう。'
      case 'Ǝ':
        return '観測は力になる。今夜5分、今日のハイライトを言語化してみて。'
      default:
        return '今日の記録を残すと、ここにルネアの一言が表示されます。'
    }
  }
  const closing = useMemo(() => luneaClosing(latestCode || ''), [latestCode])

  const fmt = (iso?: string) => {
    if (!iso) return ''
    try {
      const d = new Date(iso)
      return new Intl.DateTimeFormat('ja-JP', {
        dateStyle: 'medium',
        timeStyle: 'short',
        timeZone: 'Asia/Tokyo',
      }).format(d)
    } catch {
      return iso ?? ''
    }
  }

  return (
    <div style={{ maxWidth: 820, margin: '0 auto', padding: '16px' }}>
      <header style={{ margin: '8px 0 16px' }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-.01em' }}>MYPAGE</h1>
        <p style={{ fontSize: 12, opacity: 0.7 }}>保存された履歴と現在のテーマを表示します。</p>
      </header>

      {/* 現在のテーマ */}
      <section
        className="glass"
        style={{
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
          background: 'rgba(255,255,255,.06)',
          backdropFilter: 'blur(10px) saturate(120%)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {latestCode ? (
              <FlatIcon type={latestCode as TypeKey} />
            ) : (
              <div
                style={{
                  width: BADGE_SIZE,
                  height: BADGE_SIZE,
                  borderRadius: BADGE_RADIUS_PX,
                  display: 'grid',
                  placeItems: 'center',
                  background: '#c7c9d1',
                  color: '#000',
                  fontWeight: 900,
                }}
              >
                —
              </div>
            )}
            <div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>現在のテーマ</div>
              <div style={{ fontSize: 18, fontWeight: 800, marginTop: 4 }}>{theme}</div>
              {themeSetAt ? (
                <div style={{ fontSize: 12, opacity: 0.6, marginTop: 4 }}>{fmt(themeSetAt)}</div>
              ) : null}
              <div style={{ fontSize: 12, opacity: 0.75, marginTop: 6 }}>ナビゲーター：{navName}</div>
            </div>
          </div>
          <a href="/theme" style={{ fontSize: 12, opacity: 0.8, textDecoration: 'underline' }}>
            変更する
          </a>
        </div>
      </section>

      {/* ルネアからの一言 */}
      <section
        className="glass"
        style={{
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 14,
          padding: 16,
          marginBottom: 12,
          background: 'rgba(255,255,255,.06)',
          backdropFilter: 'blur(10px) saturate(120%)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <FlatIcon type={(latestCode || 'E') as TypeKey} />
          <div style={{ fontSize: 14, lineHeight: 1.6 }}>{closing}</div>
        </div>
      </section>

      {/* 履歴 */}
      <section
        className="glass"
        style={{
          border: '1px solid rgba(255,255,255,.12)',
          borderRadius: 14,
          padding: 0,
          overflow: 'hidden',
          background: 'rgba(255,255,255,.06)',
          backdropFilter: 'blur(10px) saturate(120%)',
        }}
      >
        <div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,.12)' }}>
          <div style={{ fontWeight: 700 }}>最近の診断履歴</div>
          <div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>直近30件まで表示</div>
        </div>

        {loading ? (
          <div style={{ padding: 16, fontSize: 12, opacity: 0.7 }}>読み込み中...</div>
        ) : error ? (
          <div style={{ padding: 16, fontSize: 12, color: '#ffa2a2' }}>{error}</div>
        ) : !rows || rows.length === 0 ? (
          <div style={{ padding: 16, fontSize: 12, opacity: 0.7 }}>まだ保存された診断がありません。</div>
        ) : (
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {rows.map((r) => {
              const code = normalizeCode(r.code)
              return (
                <li
                  key={r.id}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '48px 1fr auto',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px 16px',
                    borderTop: '1px solid rgba(255,255,255,.08)',
                  }}
                >
                  {code ? (
                    <FlatIcon type={code as TypeKey} />
                  ) : (
                    <div
                      style={{
                        width: BADGE_SIZE,
                        height: BADGE_SIZE,
                        borderRadius: BADGE_RADIUS_PX,
                        display: 'grid',
                        placeItems: 'center',
                        background: '#c7c9d1',
                        color: '#000',
                        fontWeight: 900,
                      }}
                      title={code}
                    >
                      —
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 700 }}>デイリー診断 {code || ''}</div>
                    <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{r.choice || '—'}</div>
                    {r.theme ? (
                      <div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>テーマ：{r.theme}</div>
                    ) : null}
                  </div>
                  <time style={{ fontSize: 12, opacity: 0.6 }}>{fmt(r.created_at)}</time>
                </li>
              )
            })}
          </ul>
        )}
      </section>
    </div>
  )
}
