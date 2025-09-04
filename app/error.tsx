// app/error.tsx
"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: any; reset: () => void }) {
  useEffect(() => {
    // ここでログ送信など
    console.error("[app error]", error);
  }, [error]);

  return (
    <div className="min-h-[100svh] grid place-items-center bg-black text-white p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-semibold">エラーが発生しました</h1>
        <p className="text-white/70 text-sm">
          画面を再読み込みするか、前のページに戻ってやり直してください。
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => reset()}
            className="px-4 h-10 rounded-lg bg-white text-black"
          >
            再試行
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 h-10 rounded-lg bg-white/10 border border-white/15"
          >
            トップへ
          </button>
        </div>
      </div>
    </div>
  );
}
