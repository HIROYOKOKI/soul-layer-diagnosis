// app/layout.tsx
import "./globals.css";
import AuthSync from "@/components/AuthSync";
import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthSync />
        <AppHeader />
        {/* ← 余白は付けない（stickyがフローに乗るため不要） */}
        <main className="min-h-dvh">{children}</main>
        <AppFooter />
      </body>
    </html>
  );
}
