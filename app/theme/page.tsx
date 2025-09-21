// app/theme/page.tsx
'use client';

import { useEffect, useState } from 'react';

type Scope = 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE';

export default function ThemePage() {
  const [saving, setSaving] = useState(false);
  const [scope, setScope] = useState<Scope>('WORK');
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('/api/theme', { cache: 'no-store' });
        const json = await r.json();
        if (json?.ok && json?.scope) setScope(json.scope as Scope);
      } catch {/* no-op */}
    })();
  }, []);

  async function apply(s: Scope) {
    setSaving(true); setMsg(null);
    try {
      const r = await fetch('/api/theme/set', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ scope: s }),
      });
      const json = await r.json();
      if (json?.ok) { setScope(s); setMsg('テーマを保存しました'); }
      else setMsg(json?.error ?? '保存に失敗しました');
    } catch (e:any) { setMsg(e?.message ?? '保存に失敗しました'); }
    finally { setSaving(false); }
  }

  const list: Scope[] = ['WORK','LOVE','FUTURE','LIFE'];

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-gray-100">
      <h1 className="text-2xl font-semibold mb-6">テーマ設定</h1>
      <div className="grid grid-cols-2 gap-3">
        {list.map((s) => (
          <button key={s} disabled={saving}
            className={`rounded-xl border px-4 py-3 text-left ${scope===s ? 'bg-white/15 border-white/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            onClick={() => apply(s)}>
            <div className="text-base font-semibold">{s}</div>
            <div className="text-xs opacity-70">
              {s==='WORK'?'仕事':s==='LOVE'?'愛':s==='FUTURE'?'未来':'生活'}
            </div>
          </button>
        ))}
      </div>
      {msg && <p className="mt-4 text-sm text-neutral-300">{msg}</p>}
    </div>
  );
}
