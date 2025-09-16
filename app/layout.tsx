// app/layout.tsx
import "./globals.css"
import AuthSync from "@/components/AuthSync"
import AppHeader from "./components/AppHeader"
import AppFooter from "./components/AppFooter"
import { headers } from "next/headers"

export const dynamic = "force-dynamic"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // 現在のパスを取得
  const pathname = headers().get("x-invoke-path") || ""

  // ヘッダーを出さないページ一覧
  const noHeaderPaths = ["/", "/intro"]

  const showHeader = !noHeaderPaths.includes(pathname)

  return (
    <html lang="ja">
      <body>
        <AuthSync />
        {showHeader && <AppHeader />}
        {/* showHeader のときだけ余白を追加 */}
        <main className={showHeader ? "min-h-dvh pt-16" : "min-h-dvh"}>
          {children}
        </main>
        {showHeader && <AppFooter />}
      </body>
    </html>
  )
}
