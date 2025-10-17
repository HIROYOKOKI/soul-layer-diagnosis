// app/mypage/MyPageClientWrapper.tsx
'use client';

'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function MyPageClientWrapper() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  // デバッグ：クリック反応チェック
  function handleDebug() {
    // ここが動けばオーバーレイ問題 or ルーター問題以外はクリア
    alert('clicked');
  }

  return (
    <div className="relative z-10 p-6">
      <h1 className="text-2xl font-semibold mb-4">My Page</h1>

      <div className="flex flex-col gap-3">
        <button
          type="button"
          onClick={handleDebug}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
        >
          Debug Click（警告ダイアログが出ればOK）
        </button>

        <button
          type="button"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            router.push('/daily'); // ← デイリー診断へ
          }}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 disabled:opacity-60"
        >
          デイリー診断をはじめる
        </button>

        <button
          type="button"
          onClick={() => router.push('/daily/question')}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
        >
          今日の質問を見る
        </button>

        <button
          type="button"
          onClick={() => router.push('/daily/result')}
          className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
        >
          最新の結果を見る
        </button>
      </div>
    </div>
  );
}
