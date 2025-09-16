// app/layout.tsx
"use client"; // ← ここでClient化する

import "./globals.css";
import { usePathname } from "next/navigation";
import AuthSync from "@/components/AuthSync";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClientChrome from "./components/ClientChrome";

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideChrome = pathname?.startsWith("/intro");

  return (
    <html lang="ja">
      <body>
        <AuthSync />
        {!hideChrome && <Header />}
        <ClientChrome>{children}</ClientChrome>
        {!hideChrome && <Footer />}
      </body>
    </html>
  );
}
