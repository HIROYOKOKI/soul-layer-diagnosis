import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EVΛƎ — Soul Layer Diagnosis",
  description: "EVΛƎ: ソウルレイヤー診断アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className={[inter.className, "min-h-dvh bg-black text-white antialiased"].join(" ")}>
        <div className="flex min-h-dvh flex-col">
          <AppHeader />
          <main className="flex-1 pt-16 pb-10">{children}</main>
          <AppFooter />
        </div>
      </body>
    </html>
  );
}
