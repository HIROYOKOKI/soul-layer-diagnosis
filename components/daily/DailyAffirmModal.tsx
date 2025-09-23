'use client'

import { useState } from "react"

export default function DailyAffirmModal({ daily }: { daily: any }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* アファメーションのボタン */}
      <button
        onClick={() => setOpen(true)}
        className="w-full px-4 py-3 rounded-xl bg-neutral-800 text-white font-medium hover:bg-neutral-700 transition"
      >
        {daily?.affirm ?? "まだ診断がありません"}
      </button>

      {/* モーダル本体 */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setOpen(false)} // 背景クリックで閉じる
        >
          <div
            className="bg-black rounded-2xl p-6 max-w-md w-full border border-white/10 text-white"
            onClick={(e) => e.stopPropagation()} // カードクリックは閉じない
          >
            <h2 className="text-lg font-bold mb-4">今日の診断詳細</h2>
            <p className="text-sm mb-2">
              <span className="text-white/60">コメント：</span>{daily?.comment}
            </p>
            <p className="text-sm mb-2">
              <span className="text-white/60">アドバイス：</span>{daily?.advice}
            </p>
            <p className="text-sm mb-2">
              <span className="text-white/60">スコア：</span>{Number(daily?.score ?? 0).toFixed(1)}
            </p>
            <button
              onClick={() => setOpen(false)}
              className="mt-4 w-full px-4 py-2 bg-neutral-700 text-white rounded-lg"
            >
              閉じる
            </button>
          </div>
        </div>
      )}
    </>
  )
}
