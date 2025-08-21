'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function AppHeader() {
  const pathname = usePathname()
  // ここでヘッダーを出さないルートを定義
  const hide =
    pathname === '/login' ||
    pathname?.startsWith('/intro') // ←将来の全画面ページがあれば追加

  if (hide) return null

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur">
      <div className="mx-auto max-w-3xl px-4 h-12 flex items-center justify-between">
        <button onClick={() => history.back()} className="text-sm hover:opacity-80">← 戻る</button>
        <div className="text-sm font-medium">EVΛƎ · Daily</div>
        <Link href="/mypage" className="text-sm hover:opacity-80">MyPage</Link>
      </div>
      <nav className="mx-auto max-w-3xl px-4 py-2 flex gap-4 text-sm">
        <Link href="/">Home</Link>
        <Link href="/daily">Daily</Link>
        <Link href="/weekly">Weekly</Link>
        <Link href="/monthly">Monthly</Link>
      </nav>
    </header>
  )
}
