// app/log/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { formatJP } from '@/components/layout/date';

type EV = 'E'|'V'|'Λ'|'Ǝ';
type DailyItem = { code?: EV|null; comment?: string|null; created_at?: string|null }|null;
type ProfileItem = { fortune?: string|null; personality?: string|null; partner?: string|null; created_at?: string|null }|null;

export default function LogPage() {
  const [loading,setLoading]=useState(true);
  const [err,setErr]=useState<string|null>(null);
  const [daily,setDaily]=useState<DailyItem>(null);
  const [profile,setProfile]=useState<ProfileItem>(null);

  useEffect(()=>{
    let cancel=false;
    (async()=>{
      setLoading(true);
      try {
        const [d,p]=await Promise.all([
          fetch('/api/mypage/daily-latest',{cache:'no-store'}).then(r=>r.json()),
          fetch('/api/mypage/profile-latest',{cache:'no-store'}).then(r=>r.json()),
        ]);
        if(!cancel){ setDaily(d?.item??null); setProfile(p?.item??null); }
      } catch(e:any){ if(!cancel) setErr(e?.message??'failed_to_load'); }
      finally{ if(!cancel) setLoading(false); }
    })();
    return ()=>{cancel=true};
  },[]);

  if(loading) return <div className="max-w-xl mx-auto px-4 py-10 text-neutral-400">読み込み中…</div>;
  if(err) return <div className="max-w-xl mx-auto px-4 py-10 text-red-400">エラー：{err}</div>;

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-gray-100 space-y-6">
      <section>
        <div className="text-xs uppercase tracking-wider text-neutral-400 mb-2">デイリー（最新）</div>
        {daily ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">コード</span>
              <span className="text-base">{daily?.code ?? '-'}</span>
            </div>
            <div className="mt-2 text-neutral-300 leading-relaxed">{daily?.comment ?? 'コメントはありません。'}</div>
            <div className="mt-2 text-xs text-neutral-400">更新: {daily?.created_at ? formatJP(daily.created_at) : ''}</div>
          </div>
        ) : <div className="text-neutral-500">記録がありません。</div>}
      </section>

      <section>
        <div className="text-xs uppercase tracking-wider text-neutral-400 mb-2">プロフィール（最新）</div>
        {profile ? (
          <div className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-2">
            <div><span className="text-neutral-400 mr-2">運勢</span><span className="font-medium">{profile?.fortune ?? '-'}</span></div>
            <div><span className="text-neutral-400 mr-2">性格</span><span className="font-medium">{profile?.personality ?? '-'}</span></div>
            <div><span className="text-neutral-400 mr-2">理想/相性</span><span className="font-medium">{profile?.partner ?? '-'}</span></div>
            <div className="text-xs text-neutral-400">更新: {profile?.created_at ? formatJP(profile.created_at) : ''}</div>
          </div>
        ) : <div className="text-neutral-500">記録がありません。</div>}
      </section>
    </div>
  );
}
