// app/mypage/layout.tsx
import type { ReactNode } from 'react'
import AppHeader from '@/components/AppHeader'

export default function MyPageLayout({ children }: { children: ReactNode }) {
  return (
    <>
      {/* ヘッダー：ロゴは /public/soul-layer-diagnosis.png を使用 */}
      <AppHeader showBack={false} title="MY PAGE" />
      {children}
    </>
  )
}
