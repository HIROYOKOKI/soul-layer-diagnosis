'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type Pending = {
  choiceText: string;                 // ← ここを必ず表示する
  code: 'E' | 'V' | 'Λ' | 'Ǝ';
  result: { type: string; weight: number; comment: string; advice?: string };
  _meta?: { ts: number; v: string };
};

export default function ConfirmClient() {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending');
      if (!raw) { setErr('データが見つかりません。クイック判定からやり直してください。'); return; }
      setPending(JSON.parse(raw) as Pending);
      console.log('[Confirm] pending =', JSON.parse(raw));
    } catch (e) {
      console.error(e);
      setErr('読み込みに失敗しました。');
    }
  }, []);

  const handleSave = async () => {
    if (!pending) return;
    setSaving(true);
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
      console.error(e);
      setSaving(false);
      setErr('保存に失敗しました');
    }
  };

  return (
    <div className="mx-auto max-w-md px-5 py-10">
      <h1 className="text-center text-lg font-bold mb-4">内容の確認</h1>

      {err && <div className="mb-4 text-sm text-red-400">{err}</div>}

      {!pending ? (
        <p className="text-white/70">読み込み中…</p>
      ) : (
        <>
          {/* ✅ まず “選択内容” を見せる */}
          <div className="mb-5 rounded-xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-white/60">あなたの選択</div>
            <div className="mt-1 text-base font-medium">{pending.choiceText}</div>
            <div className="mt-1 text-xs text-white/40">コード：{pending.code}</div>
          </div>

          {/* 結果を開示 */}
          {!showResult ? (
            <button
              className="w-full rounded-lg border border-white/20 py-2 hover:bg-white/5"
              onClick={() => setShowResult(true)}
            >
              結果を表示
            </button>
          ) : (
            <div className="space-y-4">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs text-white/60">判定タイプ</div>
                <div className="mt-1 text-base font-semibold">{pending.result.type}</div>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <div className="text-xs text-white/60">コメント</div>
                <p className="mt-1">{pending.result.comment}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => router.push('/structure/quick')}
                  className="rounded-lg border border-white/20 py-2 hover:bg-white/5"
                >
                  やり直す
                </button>
                <button
                  disabled={saving}
                  onClick={handleSave}
                  className="rounded-lg bg-white text-black py-2 font-medium disabled:opacity-60"
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
