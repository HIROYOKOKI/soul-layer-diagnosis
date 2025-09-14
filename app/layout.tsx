import type { Metadata } from "next";
import { Inter } from "next/font/google";
import ClientChrome from "./components/ClientChrome";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EVΛƎ — Soul Layer Diagnosis",
  description: "EVΛƎ: ソウルレイヤー診断アプリ",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className={[inter.className, "min-h-dvh bg-black text-white antialiased"].join(" ")}>
        <ClientChrome>{children}</ClientChrome>
      </body>
    </html>
  );
}
