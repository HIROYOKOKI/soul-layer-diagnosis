// app/theme/page.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Scope = 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE';
const LABEL: Record<Scope, string> = {
  WORK: '仕事',
  LOVE: '愛',
  FUTURE: '未来',
  LIFE: '生活',
};

export default function ThemePage() {
  const router = useRouter();

  const [current, setCurrent] = useState<Scope>('LIFE'); // 取得済みの保存値
  const [selected, setSelected] = useState<Scope>('LIFE'); // 画面上の選択（未保存）
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // 初期：現在のテーマをGET
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/theme', { cache: 'no-store' });
        const j = await r.json();
        const scope = (j?.scope as Scope) ?? 'LIFE';
        setCurrent(scope);
        setSelected(scope);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const dirty = useMemo(() => selected !== current, [selected, current]);

  function onSelect(s: Scope) {
    setSelected(s);
    // 触感（対応端末のみ）
    (navigator as any).vibrate?.(10);
  }

  async function doSave() {
    setSaving(true);
    setConfirmOpen(false);
    try {
      // 1) テーマ保存
      const r1 = await fetch('/api/theme/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: selected }),
      });
      const j1 = await r1.json();
      if (!j1?.ok) throw new Error(j1?.error ?? 'failed_to_save');

      // 2) 記録初期化（ソフトリセットの土台API）
      const r2 = await fetch('/api/theme/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope: selected }),
      }).catch(() => null);
      const j2 = await r2?.json().catch(() => null);
      if (!j2?.ok) throw new Error(j2?.error ?? 'failed_to_reset');

      setCurrent(selected);
      setToast('テーマを保存しました');
      setTimeout(() => setToast(null), 2000);

      // 3) マイページへ
      router.push('/mypage');
    } catch (e: any) {
      setToast(`保存に失敗しました：${e?.message ?? 'unknown'}`);
      setTimeout(() => setToast(null), 3500);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10 text-gray-100">
        読み込み中…
      </div>
    );
  }

  const list: Scope[] = ['WORK', 'LOVE', 'FUTURE', 'LIFE'];

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-gray-100">
      <h1 className="text-2xl font-semibold mb-6">テーマ設定</h1>

      {/* 即保存しない：選択のみ */}
      <div className="grid grid-cols-2 gap-3">
        {list.map((s) => {
          const active = selected === s;
          return (
            <button
              key={s}
              disabled={saving}
              className={[
                'rounded-xl border px-4 py-3 text-left transition-colors',
                active
                  ? 'bg-white/15 border-white/30'
                  : 'bg-white/5 border-white/10 hover:bg-white/10',
              ].join(' ')}
              onClick={() => onSelect(s)}
            >
              <div className="text-base font-semibold">{s}</div>
              <div className="text-xs opacity-70">{LABEL[s]}</div>
              {active && <div className="mt-1 text-[11px] text-white/60">選択中</div>}
            </button>
          );
        })}
      </div>

      {/* 下部バー：変更があるときだけ表示 */}
      {dirty && (
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-white/15 bg-white/5 hover:bg-white/10 text-sm"
            disabled={saving}
            onClick={() => setSelected(current)}
          >
            キャンセル
          </button>
          <button
            type="button"
            className="px-4 py-2 rounded-lg border border-violet-400/40 bg-violet-500/20 hover:bg-violet-500/30 text-sm"
            disabled={saving}
            onClick={() => setConfirmOpen(true)}
          >
            保存
          </button>
        </div>
      )}

      {toast && <p className="mt-4 text-sm text-neutral-300">{toast}</p>}

      {/* 確認モーダル（テーマ変更で初期化警告） */}
      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/60" onClick={() => !saving && setConfirmOpen(false)} />
          <div className="relative z-10 w-[92%] max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-5">
            <div className="text-base font-semibold mb-2">テーマ変更の確認</div>
            <p className="text-sm text-neutral-300 leading-relaxed">
              テーマを変更すると、テーマ別の記録・集計は初期化されます。よろしいですか？
            </p>
            <div className="mt-4 flex justify-end gap-3">
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg border border-white/15 bg-white/5 hover:bg-white/10"
                onClick={() => setConfirmOpen(false)}
                disabled={saving}
              >
                キャンセル
              </button>
              <button
                type="button"
                className="px-3 py-2 text-sm rounded-lg border border-red-500/40 bg-red-600/20 hover:bg-red-600/30"
                onClick={doSave}
                disabled={saving}
              >
                変更して初期化
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
