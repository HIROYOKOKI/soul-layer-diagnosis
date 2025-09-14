// app/layout.tsx
import "./globals.css";
import AuthSync from "@/components/AuthSync";

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <AuthSync /> {/* ★ 追加：どのページでもCookie同期 */}
        {children}
      </body>
    </html>
  );
}
