// app/structure/quick/confirm/ConfirmClient.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { normalizePending, type PendingV1 } from '../_utils/normalizePending';

export default function ConfirmClient() {
  const router = useRouter();
  const [pending, setPending] = useState<PendingV1 | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const norm = normalizePending(sessionStorage.getItem('structure_quick_pending'));
    if (!norm) {
      setErr('データが見つかりません。クイック判定からやり直してください。');
      return;
    }
    setPending(norm);
  }, []);

  const handleSave = async () => {
    if (!pending) return;
    setSaving(true);
    setErr(null);
    try {
      const r = await fetch('/api/structure/quick/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: pending.result.type,
          weight: pending.result.weight,
          comment: pending.result.comment,
        }),
      });
      if (!r.ok) throw new Error(String(r.status));
      const { id } = await r.json();
      router.push(`/structure/quick/result?id=${encodeURIComponent(id)}`);
    } catch (e) {
      console.error('[Confirm] save error', e);
      setSaving(false);
      setErr('保存に失敗しました。時間をおいて再度お試しください。');
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      {/* タイトル：内容の確認 → 診断結果 */}
      <h1 className="text-center text-xl font-bold mb-5">
        {showResult ? '診断結果' : '内容の確認'}
      </h1>

      {err && (
        <div className="mb-4 rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-sm">
          {err}
        </div>
      )}

      {!pending ? (
        <p className="text-white/70">読み込み中…</p>
      ) : (
        <>
          {/* あなたの選択 */}
          <div className="mb-5 rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-white/60">あなたの選択</div>
            <div className="mt-1 text-base font-medium">
              {pending.choiceText || '(選択内容は記録されていません)'}
            </div>
            <div className="mt-1 text-xs text-white/40">コード：{pending.code}</div>
          </div>

          {/* 結果の開示 or 表示 */}
          {!showResult ? (
            <button
              className="w-full rounded-xl !border-2 !border-white border-solid text-white py-2
                         bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white
                         active:scale-[0.99] transition"
              onClick={() => setShowResult(true)}
            >
              結果を表示
            </button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs text-white/60">判定タイプ</div>
                <div className="mt-1 text-base font-semibold tracking-wide">
                  {pending.result.type}
                </div>
              </div>

              <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs text-white/60">コメント</div>
                <p className="mt-1 leading-relaxed">{pending.result.comment}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                {/* やり直す：白枠のアウトライン */}
                <button
                  onClick={() => router.push('/structure/quick')}
                  className="rounded-xl !border-2 !border-white border-solid text-white py-2
                             bg-transparent hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white
                             active:scale-[0.99] transition"
                >
                  やり直す
                </button>

                {/* 保存する：白塗り＋白枠 */}
                <button
                  disabled={saving}
                  onClick={handleSave}
                  className="rounded-xl bg-white text-black py-2 font-medium
                             !border-2 !border-white border-solid
                             hover:opacity-90 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-white
                             active:scale-[0.99] transition"
                >
                  {saving ? '保存中…' : '保存する'}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
