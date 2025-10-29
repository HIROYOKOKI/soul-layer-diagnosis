import "./globals.css";
import AuthSync from "@/components/AuthSync";
import LayoutClient from "./LayoutClient"; // ← ここに統一

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      {/* body にクラスを付ける必要はないが、付けてもOK */}
      <body>
        <AuthSync />
        <LayoutClient>{children}</LayoutClient>
      </body>
    </html>
  );
}
