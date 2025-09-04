// app/structure/quick/result/result-client.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type EV = 'E' | 'V' | 'Λ' | 'Ǝ';

type PendingV1 = {
  choiceText: string;
  code: EV;
  result: { type: string; weight: number; comment: string; advice?: string };
  _meta?: { ts: number; v: 'quick-v1' };
};

// 型ごとの補足説明（既存ロジックそのまま）
function typeDescription(type: string): string {
  switch (type) {
    case 'EVA型':
      return '衝動・行動型：思い立ったらまず動くタイプ。挑戦しながら学びを積み重ねる。';
    case 'EVΛ型':
      return '夢・可能性型：広い視点で理想を描き、可能性を探るタイプ。想像力やビジョンを大事にする。';
    case 'ΛEƎ型':
      return '設計・計画型：基準やルールを決め、効率よく最短ルートを選ぶ。整理と取捨選択が得意。';
    case 'ƎVΛE型':
      return '観察・分析型：状況を観測して小さく試し、結果を見て選び直す。分析や状況把握に強い。';
    default:
      return '';
  }
}

export default function ResultClient() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingV1 | null>(null);
  const [saving, setSaving] = useState(false);

  // セッションから結果を復元（キー名は既存実装に合わせてください）
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending');
      if (raw) setPending(JSON.parse(raw));
    } catch {
      // no-op
    }
  }, []);

  // 保存処理：submitではなく通常ボタンで実行
  const handleSave = async () => {
    if (!pending || saving) return;
    setSaving(true);
    try {
      // 保存API（あなたの実装に合わせて調整）
      // 既存テーブル daily_results の想定：code, comment, quote, choice, mode, theme など
      const payload = {
        code: pending.code,
        comment: pending.result?.comment ?? '',
        quote: pending.result?.advice ?? '', // 名言等があればここへ
        choice: pending.choiceText ?? '',
        mode: 'quick',
        theme: (localStorage.getItem('ev-theme') || 'dev') as string,
      };

      const res = await fetch('/api/daily/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        cache: 'no-store',
      });

      if (!res.ok) {
        console.error('save failed', await res.text());
        setSaving(false);
        return;
      }

      // 成功 → マイページへ
      router.push('/mypage');
      router.refresh();
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  if (!pending) {
    return (
      <div className="px-5 py-10 text-white/70">
        まだ結果がありません。最初のページからやり直してください。
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 見出しなどは既存のままでOK。以下は最低限の表示例 */}
      <section className="rounded-2xl bg-white/5 border border-white/10 p-4 text-white">
        <div className="text-sm text-white/60">判定タイプ</div>
        <div className="text-xl font-semibold mt-1">{pending.result?.type ?? ''}</div>
        <p className="text-sm text-white/70 mt-2">
          {typeDescription(pending.result?.type ?? '')}
        </p>
      </section>

      <section className="rounded-2xl bg-white/5 border border-white/10 p-4 text-white">
        <div className="text-sm text-white/60">コメント</div>
        <p className="mt-1">{pending.result?.comment ?? ''}</p>
      </section>

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="h-10 px-4 rounded-lg bg-white/10 border border-white/15 hover:bg-white/15"
        >
          戻って修正
        </button>

        {/* ✅ submitではなく通常ボタン。/theme へは飛ばない */}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={`h-10 px-4 rounded-lg bg-white text-black border border-white/10 active:opacity-90 ${
            saving ? 'opacity-60 pointer-events-none' : ''
          }`}
        >
          {saving ? '保存中…' : '保存する'}
        </button>
      </div>
    </div>
  );
}
