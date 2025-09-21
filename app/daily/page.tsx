'use client';

import { useEffect, useMemo, useState } from 'react';

type Slot = 'morning' | 'noon' | 'night';
type Theme = 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE';
type Phase = 'ask' | 'result' | 'error';

type DailyQuestionResponse = {
  ok: boolean; error?: string;
  slot: Slot; theme: Theme; seed: number;
  question: string; choices: { id: string; label: string }[];
};

type DailyAnswerResponse = {
  ok: boolean; error?: string;
  comment: string; advice?: string; affirm?: string;
  score?: number;
};

export default function DailyPage() {
  const [phase, setPhase] = useState<Phase>('ask');
  const [loading, setLoading] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [theme, setTheme] = useState<Theme>('WORK');
  const [seed, setSeed] = useState<number>(0);
  const [question, setQuestion] = useState('');
  const [choices, setChoices] = useState<{ id: string; label: string }[]>([]);
  const [result, setResult] = useState<DailyAnswerResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const r = await fetch('/api/daily/question', { cache: 'no-store' });
        const json = (await r.json()) as DailyQuestionResponse;
        if (!json.ok) throw new Error(json.error);
        setSlot(json.slot); setTheme(json.theme); setSeed(json.seed);
        setQuestion(json.question); setChoices(json.choices);
        setPhase('ask');
      } catch (e: any) { setErr(e?.message ?? 'failed_to_load'); setPhase('error'); }
      finally { setLoading(false); }
    })();
  }, []);

  async function onChoose(choiceId: string) {
    if (!seed) return;
    setLoading(true);
    try {
      const r = await fetch('/api/daily/answer', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ seed, choiceId, theme }),
      });
      const json = (await r.json()) as DailyAnswerResponse;
      if (!json.ok) throw new Error(json?.error ?? 'failed');
      setResult(json); setPhase('result');
    } catch (e:any) { setErr(e?.message ?? 'failed_to_answer'); setPhase('error'); }
    finally { setLoading(false); }
  }

  const header = useMemo(() => {
    const s = slot==='morning'?'朝':slot==='noon'?'昼':slot==='night'?'夜':'';
    const t = theme==='WORK'?'仕事':theme==='LOVE'?'愛':theme==='FUTURE'?'未来':'生活';
    return `デイリー診断${s||t ? `（${[s,t].filter(Boolean).join(' × ')}）` : ''}`;
  }, [slot, theme]);

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-gray-100">
      <h1 className="text-2xl font-semibold mb-6">{header}</h1>

      {loading && <p className="opacity-80">読み込み中…</p>}
      {phase === 'error' && <p className="text-red-400">エラー：{err}</p>}

      {phase === 'ask' && !loading && (
        <div className="space-y-4">
          <p className="opacity-90">{question}</p>
          <div className="grid gap-3 mt-4">
            {choices.map((c) => (
              <button key={c.id} className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left"
                      onClick={() => onChoose(c.id)} disabled={loading}>
                {c.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {phase === 'result' && result?.ok && (
        <div className="mt-6 space-y-4">
          <div className="rounded-2xl p-4 border border-white/10 bg-white/5">
            <div className="text-sm uppercase tracking-wider opacity-60 mb-2">コメント</div>
            <p>{result.comment}</p>
          </div>
          {result.advice && (
            <div className="rounded-2xl p-4 border border-white/10 bg-white/5">
              <div className="text-sm uppercase tracking-wider opacity-60 mb-2">アドバイス</div>
              <p>{result.advice}</p>
            </div>
          )}
          {result.affirm && (
            <div className="rounded-2xl p-4 border border-white/10 bg-white/5">
              <div className="text-sm uppercase tracking-wider opacity-60 mb-2">アファメーション</div>
              <p className="font-medium">{result.affirm}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
