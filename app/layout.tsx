// app/layout.tsx
import "./globals.css"
import AuthSync from "@/components/AuthSync";        // ← これはそのまま（@/components 側）
import AppHeader from "./components/AppHeader";      // ← 相対に変更
import AppFooter from "./components/AppFooter";      // ← 相対に変更

export const dynamic = "force-dynamic"

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthSync />
        <AppHeader />
        <main className="min-h-dvh">{children}</main>
        <AppFooter />
      </body>
    </html>
  )
}
