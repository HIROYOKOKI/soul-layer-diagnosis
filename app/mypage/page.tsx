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
   NEON ICON (発光スタイル)
   ========================= */
type TypeKey = 'E' | 'V' | 'Λ' | 'Ǝ'
const NEON_BG: Record<TypeKey, string> = {
  E: '#f15a24',  // 指定: E
  V: '#44ffff',  // 指定: V
  Λ: '#fcee21',  // 指定: Λ
  Ǝ: '#812b8c',  // 指定: Ǝ
}
// 視認性：紫のみ白文字、それ以外は黒
const NEON_FG: Record<TypeKey, string> = { E: '#111', V: '#111', Λ: '#111', Ǝ: '#fff' }
const BADGE_RADIUS_PX = 14
const BADGE_SIZE = 40

function NeonIcon({ type }: { type: TypeKey }) {
  const bg = NEON_BG[type]
  const fg = NEON_FG[type]

  const baseShadow = `
    0 0 10px ${bg}AA,
    0 0 22px ${bg}66,
    inset 0 1px 6px #ffffff40,
    inset 0 -3px 8px #00000030
  `
  const hoverShadow = `
    0 0 12px ${bg}CC,
    0 0 30px ${bg}88,
    inset 0 1px 8px #ffffff55,
    inset 0 -4px 10px #00000045
  `

  return (
    <div
      aria-label={`構造 ${type}`}
      style={{
        width: BADGE_SIZE,
        height: BADGE_SIZE,
        borderRadius: BADGE_RADIUS_PX,
        // 左上ハイライト＋本色で発光
        background: `radial-gradient(120% 120% at 30% 20%, #ffffff40 0%, ${bg} 35%)`,
        display: 'grid',
        placeItems: 'center',
        color: fg,
        fontWeight: 900,
        letterSpacing: '0.02em',
        boxShadow: baseShadow,
        transition: 'box-shadow 180ms ease, transform 180ms ease',
        willChange: 'box-shadow, transform',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = hoverShadow }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = baseShadow }}
      onTouchStart={(e) => { e.currentTarget.style.boxShadow = hoverShadow }}
      onTouchEnd={(e) => { e.currentTarget.style.boxShadow = baseShadow }}
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
              <NeonIcon type={latestCode as TypeKey} />
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
          <NeonIcon type={(latestCode || 'E') as TypeKey} />
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
                    <NeonIcon type={code as TypeKey} />
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
