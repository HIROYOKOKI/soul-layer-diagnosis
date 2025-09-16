// app/layout.tsx
import "./globals.css";
import AuthSync from "@/components/AuthSync";
import AppHeader from "@/components/AppHeader";
import AppFooter from "@/components/AppFooter";
import ClientChrome from "@/components/ClientChrome";

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthSync />
        <AppHeader />
        <ClientChrome>{children}</ClientChrome>
        <AppFooter />
      </body>
    </html>
  );
}
