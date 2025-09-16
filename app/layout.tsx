// app/layout.tsx
import "./globals.css"
import AuthSync from "@/components/AuthSync"
import AppHeader from "./components/AppHeader"
import AppFooter from "./components/AppFooter"

export const dynamic = "force-dynamic"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthSync />
        <AppHeader />
        {/* ← ヘッダー高に合わせて上余白を追加 */}
        <main className="min-h-dvh pt-16 md:pt-20">
          {children}
        </main>
        <AppFooter />
      </body>
    </html>
  )
}

