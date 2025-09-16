// app/layout.tsx
import "./globals.css";
import AuthSync from "@/components/AuthSync";
import ClientChrome from "@/components/ClientChrome"; // ← これだけでOK

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthSync />
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  );
}
