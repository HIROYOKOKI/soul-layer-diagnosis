// app/settings/page.tsx
export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-12 text-white">
      <h1 className="text-xl font-semibold mb-3">設定</h1>
      <p className="text-white/70 text-sm">
        現在は準備中です。<br />
        正式版リリース時に「アカウント管理」「通知設定」「利用規約」などをここで提供予定です。
      </p>

      <div className="mt-8 p-4 rounded-lg border border-white/10 bg-white/5 text-sm text-white/60">
        🔒 この機能はβ版ではご利用いただけません。
      </div>
    </main>
  );
}
