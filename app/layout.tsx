// app/layout.tsx
import "./globals.css";
import AuthSync from "@/components/AuthSync";
import AppHeader from "./components/AppHeader";
import LayoutClient from "./LayoutClient";

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthSync />
        <AppHeader />
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
