import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import AppHeader from "@/components/AppHeader";
import AppFrame from "@/components/AppFrame";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Soul Layer Diagnosis | EVΛƎ",
  description: "EVΛƎ · ソウルレイヤー診断",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen bg-black`}>
        {/* /login では内部で非表示にする */}
        <AppHeader />
        {/* /login は全幅、それ以外は幅制限 */}
        <AppFrame>{children}</AppFrame>
      </body>
    </html>
  );
}
