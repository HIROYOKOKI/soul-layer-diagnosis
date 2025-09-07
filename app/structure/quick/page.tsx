// app/structure/quick/page.tsx
"use client"

import { useRouter, useSearchParams } from "next/navigation"

export default function QuickPage() {
  const router = useRouter()
  const sp = useSearchParams()
  const returnTo = sp.get("return") || "/profile/result"

  function completeQuick(order: Array<"E"|"V"|"Λ"|"Ǝ">) {
    sessionStorage.setItem(
      "structure_quick_pending",
      JSON.stringify({
        order,
        points: { E: 3, V: 2, Λ: 1, Ǝ: 0 }, // 仮の点数でOK
      })
    )
    router.replace(returnTo)
  }

  return (
    <div className="mx-auto max-w-md p-6 space-y-4">
      <h1 className="text-lg font-semibold text-white/90 mb-2">クイック判定（テスト）</h1>
      <p className="text-white/60 text-sm">本実装のUIが入るまでの暫定ボタンです。押すと判定完了→結果へ戻ります。</p>
      <button
        onClick={() => completeQuick(["E","V","Λ","Ǝ"])}
        className="w-full h-12 rounded-xl bg-[#B833F5] text-white font-medium shadow-md hover:shadow-lg"
      >
        クイック判定を完了して戻る
      </button>
    </div>
  )
}
