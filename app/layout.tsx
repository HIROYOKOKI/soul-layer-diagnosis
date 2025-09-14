import AppHeader from "./components/AppHeader";
import AppFooter from "./components/AppFooter"; // ← フッターも分けるなら

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja" className="h-full">
      <body className="min-h-dvh bg-black text-white antialiased">
        <div className="flex min-h-dvh flex-col">
          <AppHeader />
          <main className="flex-1 pt-16 pb-10">{children}</main>
          <AppFooter />
        </div>
      </body>
    </html>
  );
}
