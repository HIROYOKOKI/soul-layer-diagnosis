// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Universal Prompt Builder — Blog専用 β",
  description: "入力→テンプレ整形→コピー／保存だけ（AIは呼びません）",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-black text-white min-h-screen">{children}</body>
    </html>
  );
}

