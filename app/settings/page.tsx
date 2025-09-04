// app/settings/page.tsx
export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-8 text-white">
      <h1 className="text-xl font-semibold mb-2">設定</h1>
      <p className="text-sm text-white/60 mb-6">アカウントや各種設定を管理します。</p>

      <ul className="space-y-3">
        <li><a href="/settings/account" className="block p-4 rounded-lg bg-white/5 hover:bg-white/10">アカウント</a></li>
        <li><a href="/settings/profile" className="block p-4 rounded-lg bg-white/5 hover:bg-white/10">プロフィール</a></li>
        <li><a href="/settings/notifications" className="block p-4 rounded-lg bg-white/5 hover:bg-white/10">通知設定</a></li>
        <li><a href="/settings/theme" className="block p-4 rounded-lg bg-white/5 hover:bg-white/10">表示テーマ</a></li>
        <li><a href="/settings/subscription" className="block p-4 rounded-lg bg-white/5 hover:bg-white/10">プラン/支払い</a></li>
        <li><a href="/legal/terms" className="block p-4 rounded-lg bg-white/5 hover:bg-white/10">利用規約</a></li>
        <li><a href="/legal/privacy" className="block p-4 rounded-lg bg-white/5 hover:bg-white/10">プライバシーポリシー</a></li>
        <li><a href="/legal/compliance" className="block p-4 rounded-lg bg-white/5 hover:bg-white/10">コンプライアンス</a></li>
      </ul>
    </main>
  );
}
