// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soul Layer Diagnosis",
  description: "EVΛƎ — Soul Layer Diagnosis",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      {/* ここでアプリ全体のベース色を指定（globals.css と二重で堅く） */}
      <body className="bg-black text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
