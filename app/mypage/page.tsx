import MyPageClient from "./MyPageClient";

export default function MyPagePage() {
  return <MyPageClient />;
}

<div className="flex w-full items-center justify-between rounded-2xl bg-gray-100 p-4">
<div>
<div className="text-sm text-gray-600">選択中のテーマ</div>
<div className="text-lg font-medium text-gray-800">データなし</div>
</div>
<button className="rounded-xl bg-black text-white px-3 py-1 text-sm" onClick={() => router.push('/theme')}>選ぶ</button>
</div>
)}
</motion.div>
</AnimatePresence>

{/* 最新プロフィール診断 */}
<AnimatePresence>
<motion.div key="profile" {...fadeUp} className="rounded-2xl ring-1 ring-gray-200 p-4">
<div className="text-sm text-gray-600 mb-2">最新プロフィール診断</div>
{profile ? (
<div className="space-y-1">
<div className="font-medium">運勢: {profile.fortune ?? '—'}</div>
<div className="text-sm">性格: {profile.personality ?? '—'}</div>
<div className="text-sm">理想の相手: {profile.partner ?? '—'}</div>
<div className="text-xs text-gray-500">{new Date(profile.created_at!).toLocaleString()}</div>
</div>
) : (
<div className="text-gray-500">データなし</div>
)}
</motion.div>
</AnimatePresence>

{/* 最新デイリー診断 */}
<AnimatePresence>
<motion.div key="daily" {...fadeUp} className="rounded-2xl ring-1 ring-gray-200 p-4">
<div className="text-sm text-gray-600 mb-2">最新デイリー診断</div>
{daily ? (
<div className="space-y-1">
<div className="font-medium">コード: {daily.code ?? '—'}</div>
<div className="text-sm whitespace-pre-line">{daily.comment ?? '—'}</div>
{daily.quote ? <div className="text-xs opacity-75 mt-2">“{daily.quote}”</div> : null}
<div className="text-xs text-gray-500">{new Date(daily.created_at!).toLocaleString()}</div>
</div>
) : (
<div className="text-gray-500">データなし</div>
)}
</motion.div>
</AnimatePresence>

{/* （今後）レーダーチャート・統計置き場 */}
<div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-gray-500">
将来のレーダーチャート（E/V/Λ/Ǝ）表示スペース
</div>
</div>
);
}

