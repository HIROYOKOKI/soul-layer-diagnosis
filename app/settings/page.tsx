// app/settings/page.tsx
"use client";
import { useRouter } from "next/navigation";

const items = [
  { href: "/settings/account", title: "アカウント", desc: "メール・パスワード・削除" },
  { href: "/settings/profile", title: "プロフィール", desc: "表示名・アイコン・自己紹介" },
  { href: "/settings/notifications", title: "通知設定", desc: "メール/プッシュのON/OFF" },
  { href: "/settings/theme", title: "表示テーマ", desc: "ダーク/ライト切替（診断テーマとは別）" },
  { href: "/settings/subscription", title: "プラン/支払い", desc: "プラン変更・解約・履歴" },
  { href: "/legal/terms", title: "利用規約", desc: "最新の規約を表示" },
  { href: "/legal/privacy", title: "プライバシー", desc: "個人情報の取り扱い" },
  { href: "/legal/compliance", title: "コンプライアンス", desc: "行動規範・特商法等" },
];

export default function SettingsPage() {
  const router = useRouter();
  return (
    <main className="mx-auto max-w-xl px-5 py-8 text-white">
      <h1 className="text-xl font-semibold">設定</h1>
      <p className="text-sm text-white/60 mt-1">アカウントや各種設定を管理します。</p>
      <ul className="mt-6 space-y-3">
        {items.map((x) => (
          <li key={x.href}>
            <button
              onClick={() => router.push(x.href)}
              className="w-full text-left rounded-2xl border border-white/10 bg-white/5 hover:bg-white/8 p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{x.title}</div>
                  <div className="text-sm text-white/60">{x.desc}</div>
                </div>
                <span className="text-white/40">›</span>
              </div>
            </button>
          </li>
        ))}
      </ul>
    </main>
  );
}
