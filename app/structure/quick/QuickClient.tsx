// app/structure/quick/QuickClient.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

/** Quick 用の正規スキーマ（v1）— 依存を断つためローカル定義 */
type PendingV1 = {
  choiceText: string;
  code: 'E' | 'V' | 'Λ' | 'Ǝ';
  result: { type: string; weight: number; comment: string; advice?: string };
  _meta?: { ts: number; v: 'quick-v1' };
};

/** 簡易サンプル：既存の判定ロジックがある場合は置き換えOK */
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

/** 診断結果カードと統一した「独立カードボタン」 */
function CardOption({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  // 先頭の "A." "B." … を小さなバッジに
  const badge = label.substring(0, 2).replace('.', '');
  const text = label.slice(3);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="group w-full text-left rounded-2xl bg-white/5 border border-white/12
                 px-4 py-4 transition
                 hover:bg-white/8 hover:border-white/20
                 active:scale-[0.99]
                 focus:outline-none focus:ring-2 focus:ring-white/30
                 disabled:opacity-60"
      aria-label={label}
    >
      <div className="flex items-start gap-3">
        <span
          className="mt-0.5 inline-flex h-6 min-w-6 items-center justify-center
                     rounded-full border border-white/25 text-xs text-white/80
                     px-2 py-0.5"
        >
          {badge}
        </span>
        <span className="text-[15px] leading-relaxed text-white">{text}</span>
      </div>
    </button>
  );
}

export default function QuickClient() {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choices: Array<{ label: string; code: PendingV1['code'] }> = [
    { label: 'A. とりあえず動く。やりながら整える。', code: 'E' },
    { label: 'B. 目的と制約を先に決め、最短の選択肢を絞る。', code: 'Λ' },
    { label: 'C. まず観測して小さく試し、次に要点を選び直す。', code: 'Ǝ' },
    { label: 'D. どちらとも言えない／状況により変える。', code: 'V' },
  ];

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

      {/* 本文（外枠カードは廃止。独立カード4枚を直接配置） */}
      <main className="flex-1 flex items-start justify-center px-5">
        <div className="w-full max-w-md pt-2 pb-10">
          <h2 className="text-center text-lg font-bold mb-2">クイック判定（1問）</h2>
          <p className="text-sm text-white/70 mb-5 text-center">
            新しい環境に入った直後、あなたの最初の一手は？
          </p>
          {/* 仕切り線（任意） */}
          <div className="h-px bg-white/10 mb-5" />

          {/* ✅ 独立カード 4枚 */}
          <div className="grid gap-3">
            {choices.map((c) => (
              <CardOption
                key={c.label}
                label={c.label}
                disabled={sending}
                onClick={() => handleSelect(c.label, c.code)}
              />
            ))}
          </div>

          {error && <p className="mt-4 text-xs text-red-400 text-center">{error}</p>}
        </div>
      </main>

      {/* フッター */}
      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  );
}
