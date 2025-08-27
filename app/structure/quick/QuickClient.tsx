// app/structure/quick/QuickClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PendingV1 } from '../_utils/normalizePending';

export default function QuickClient() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSelect = (choiceText: string, code: PendingV1['code']) => {
    const result = makeResultFrom(code); // ← 既存の判定ロジックに置き換え

    const payload: PendingV1 = {
      choiceText,
      code,
      result,
      _meta: { ts: Date.now(), v: 'quick-v1' },
    };

    sessionStorage.setItem('structure_quick_pending', JSON.stringify(payload));
    router.push('/structure/quick/confirm');
  };

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-center text-xl font-bold mb-6">クイック判定（1問）</h1>
      <p className="text-sm text-white/70 mb-6">
        新しい環境に入った直後、あなたの最初の一手は？
      </p>

      {/* ✅ 選択肢を「診断結果カード」と同じカードUIに */}
      <div className="space-y-4">
        <button
          onClick={() => handleSelect("A. とりあえず動く。やりながら整える。", "E")}
          className="w-full rounded-2xl border-2 border-white text-left px-4 py-3
                     bg-black/40 text-white hover:bg-white/10 active:scale-[0.99]
                     transition focus:outline-none focus:ring-2 focus:ring-white"
        >
          A. とりあえず動く。やりながら整える。
        </button>

        <button
          onClick={() => handleSelect("B. 目的と制約を先に決め、最短の選択肢を絞る。", "Λ")}
          className="w-full rounded-2xl border-2 border-white text-left px-4 py-3
                     bg-black/40 text-white hover:bg-white/10 active:scale-[0.99]
                     transition focus:outline-none focus:ring-2 focus:ring-white"
        >
          B. 目的と制約を先に決め、最短の選択肢を絞る。
        </button>

        <button
          onClick={() => handleSelect("C. まず観測して小さく試し、次に要点を選び直す。", "Ǝ")}
          className="w-full rounded-2xl border-2 border-white text-left px-4 py-3
                     bg-black/40 text-white hover:bg-white/10 active:scale-[0.99]
                     transition focus:outline-none focus:ring-2 focus:ring-white"
        >
          C. まず観測して小さく試し、次に要点を選び直す。
        </button>

        <button
          onClick={() => handleSelect("D. どちらとも言えない／状況により変える。", "V")}
          className="w-full rounded-2xl border-2 border-white text-left px-4 py-3
                     bg-black/40 text-white hover:bg-white/10 active:scale-[0.99]
                     transition focus:outline-none focus:ring-2 focus:ring-white"
        >
          D. どちらとも言えない／状況により変える。
        </button>
      </div>
    </div>
  );
}


/* ========= コンポーネント ========= */
export default function QuickClient() {
  const router = useRouter()
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onPick(choice: Choice) {
    if (sending) return
    setSending(true)
    setError(null)
    try {
      const pending = mapChoiceToPendingV1(choice)
      sessionStorage.setItem('structure_quick_pending', JSON.stringify(pending))
      console.log('[Quick] saved v1 payload:', pending) // デバッグ用
      router.push('/structure/quick/confirm')
    } catch (e) {
      console.error('[Quick] save error', e)
      setError('内部エラーが発生しました。')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="w-full p-4 flex justify-center">
        <Image
          src="/evae-logo.svg"
          alt="EVΛƎ"
          width={96}
          height={32}
          priority
          className="h-8 w-auto"
        />
      </header>

      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-neutral-900/80 border border-white/10 rounded-xl p-6">
          <h2 className="text-center text-lg font-bold mb-4">クイック判定（1問）</h2>
          <p className="text-sm text-white/70 mb-5">
            新しい環境に入った直後、あなたの最初の一手は？
          </p>

          <div className="grid gap-3">
            <button
              className="btn btn-pressable"
              disabled={sending}
              onPointerUp={() => onPick('A')}
            >
              {TEXT.A}
            </button>
            <button
              className="btn btn-pressable"
              disabled={sending}
              onPointerUp={() => onPick('B')}
            >
              {TEXT.B}
            </button>
            <button
              className="btn btn-pressable"
              disabled={sending}
              onPointerUp={() => onPick('C')}
            >
              {TEXT.C}
            </button>
            <button
              className="btn btn-pressable"
              disabled={sending}
              onPointerUp={() => onPick('D')}
            >
              {TEXT.D}
            </button>
          </div>

          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  )
}
