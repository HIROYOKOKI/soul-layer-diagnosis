'use client'

import React from 'react'
import MyPageShell from '@/components/layout/MyPageShell'
import DataBridge from '@/components/layout/DataBridge'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

/**
 * MyPage専用のエラーバウンダリ（client）
 * DataBridge/子コンポーネントの例外でページ全体が死ぬのを防ぐ
 */
class MyPageErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; message?: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(err: unknown) {
    const message = err instanceof Error ? err.message : String(err)
    return { hasError: true, message }
  }

  componentDidCatch(err: unknown) {
    // 本番で原因追跡しやすいように console に残す
    //（Vercelのブラウザログ/ユーザー報告で拾える）
    console.error('[mypage] crashed in client boundary:', err)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            MyPage を読み込めませんでした
          </h2>
          <p style={{ opacity: 0.8, marginBottom: 12 }}>
            ログイン状態の確認、または通信に失敗している可能性があります。
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <a
              href="/login"
              style={{
                display: 'inline-block',
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ddd',
                textDecoration: 'none',
              }}
            >
              ログインへ
            </a>

            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                border: '1px solid #ddd',
                background: 'transparent',
                cursor: 'pointer',
              }}
            >
              再読み込み
            </button>
          </div>

          {/* 開発中だけメッセージ表示（本番は出したくない場合は消してOK） */}
          {process.env.NODE_ENV !== 'production' && this.state.message && (
            <pre
              style={{
                marginTop: 14,
                padding: 12,
                borderRadius: 10,
                background: '#f7f7f7',
                overflowX: 'auto',
                fontSize: 12,
              }}
            >
              {this.state.message}
            </pre>
          )}
        </div>
      )
    }

    return this.props.children
  }
}

export default function Page() {
  return (
    <MyPageErrorBoundary>
      <DataBridge demo={false}>
        <MyPageShell />
      </DataBridge>
    </MyPageErrorBoundary>
  )
}
