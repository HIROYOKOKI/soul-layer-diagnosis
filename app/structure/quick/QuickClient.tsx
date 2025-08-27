// app/structure/quick/QuickClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

/** Quick 用の正規スキーマ（v1）— 型はローカル定義にして依存を断つ */
type PendingV1 = {
  choiceText: string;
  code: 'E' | 'V' | 'Λ' | 'Ǝ';
  result: { type: string; weight: number; comment: string; advice?: string };
  _meta?: { ts: number; v: 'quick-v1' };
};

/** 例：コードから簡易結果を作る。既存ロジックがあるなら置き換えOK */
function makeResultFrom(code: PendingV1['code']): PendingV1['result'] {
  switch (code) {
    case 'E':
      return {
        type: 'EVΛƎ型',
        weight: 0.8,
        comment: '衝動と行動で流れを作る傾向。まず動いて学びを回収するタイプ。',
        advice: '小さく始めて10分だけ着手。後で整える前提で前へ。'
      };
    case 'V':
      return {
        type: 'EΛVƎ型',
        weight: 0.7,
        comment: '可能性を広げてから意思決定する傾向。夢を具体化していくタイプ。',
        advice: '理想を3行で書き出し、今日の1手に落とす。'
      };
    case 'Λ':
      return {
        type: 'ΛEƎV型',
        weight: 0.75,
        comment: '選択基準を定めて最短距離を選ぶ傾向。設計と取捨選択が得意。',
        advice: '基準は3つに絞る。多すぎる迷いは切る。'
      };
    case 'Ǝ':
    default:
      return {
        type: 'ƎVΛE型',
        weight: 0.7,
        comment: '観測→小実験→選び直しの循環。状況把握が得意。',
        advice: '今日は観測者でいこう。気づきを1つだけメモする。'
      };
  }
}

export default function QuickClient() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = (choiceText: string, code: PendingV1['code']) => {
    if (sending) return;
    setSending(true);
    setError(null);

    try {
      const result = makeResultFrom(code);
      const payload: PendingV1 = {
        choiceText,
        code,
        result,
        _meta: { ts: Date.now(), v: 'quick-v1' },
      };
      sessionStorage.setItem('structure_quick_pending', JSON.stringify(payload));
      router.push('/structure/quick/confirm');
    } catch (e) {
      console.error('[Quick] save error', e);
      setError('内部エラーが発生しました。');
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      {/* ヘッダー（ロゴ） */}
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

      {/* 本文 */}
      <main className="flex-1 flex items-center justify-center px-5">
        <div className="w-full max-w-md bg-neutral-900/80 border border-white/10 rounded-2xl p-6">
          <h2 className="text-center text-lg font-bold mb-4">クイック判定（1問）</h2>
          <p className="text-sm text-white/70 mb-6">
            新しい環境に入った直後、あなたの最初の一手は？
          </p>

          {/* 4択：診断結果カードと同じ独立カードUI */}
          <div className="space-y-4">
            <button
              disabled={sending}
              onClick={() =>
                handleSelect('A. とりあえず動く。やりながら整える。', 'E')
              }
              className="w-full rounded-2xl !border-2 !border-white border-solid text-left px-4 py-3
                         bg-black/40 text-white hover:bg-white/10 active:scale-[0.99]
                         transition focus:outline-none focus:ring-2 focus:ring-white"
            >
              A. とりあえず動く。やりながら整える。
            </button>

            <button
              disabled={sending}
              onClick={() =>
                handleSelect('B. 目的と制約を先に決め、最短の選択肢を絞る。', 'Λ')
              }
              className="w-full rounded-2xl !border-2 !border-white border-solid text-left px-4 py-3
                         bg-black/40 text-white hover:bg-white/10 active:scale-[0.99]
                         transition focus:outline-none focus:ring-2 focus:ring-white"
            >
              B. 目的と制約を先に決め、最短の選択肢を絞る。
            </button>

            <button
              disabled={sending}
              onClick={() =>
                handleSelect('C. まず観測して小さく試し、次に要点を選び直す。', 'Ǝ')
              }
              className="w-full rounded-2xl !border-2 !border-white border-solid text-left px-4 py-3
                         bg-black/40 text-white hover:bg-white/10 active:scale-[0.99]
                         transition focus:outline-none focus:ring-2 focus:ring-white"
            >
              C. まず観測して小さく試し、次に要点を選び直す。
            </button>

            <button
              disabled={sending}
              onClick={() =>
                handleSelect('D. どちらとも言えない／状況により変える。', 'V')
              }
              className="w-full rounded-2xl !border-2 !border-white border-solid text-left px-4 py-3
                         bg-black/40 text-white hover:bg-white/10 active:scale-[0.99]
                         transition focus:outline-none focus:ring-2 focus:ring-white"
            >
              D. どちらとも言えない／状況により変える。
            </button>
          </div>

          {error && <p className="mt-4 text-xs text-red-400">{error}</p>}
        </div>
      </main>

      {/* フッター */}
      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  );
}
