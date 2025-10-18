// app/daily/page.tsx
'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

type Slot  = 'morning' | 'noon' | 'night';
type Theme = 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE';
type Phase = 'ask' | 'result' | 'error';

type DailyQuestionResponse = {
  ok: boolean; error?: string;
  slot: Slot; theme: Theme; seed: number;
  question: string;
  choices: { id: string; label: string }[];
};

type DailyAnswerResponse = {
  ok: boolean; error?: string;
  comment: string; advice?: string; affirm?: string;
  score?: number;
  save_error?: string | null;
};

export default function DailyPage() {
  const router = useRouter();

  const [phase, setPhase] = useState<Phase>('ask');
  const [loading, setLoading] = useState(false);
  const [slot, setSlot] = useState<Slot | null>(null);

  // ★ テーマ初期値を LOVE に統一（MyPage不取得時もズレない）
  const [theme, setTheme] = useState<Theme>('LOVE');

  const [seed, setSeed] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [choices, setChoices] = useState<{ id: string; label: string }[]>([]);
  const [result, setResult] = useState<DailyAnswerResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  // ---- MyPageと同じテーマを取得 ----
  const fetchTheme = useCallback(async (): Promise<Theme> => {
    try {
      const r = await fetch('/api/theme', { cache: 'no-store' });
      const j = await r.json();
      const t = String(j?.scope ?? j?.theme ?? 'LOVE').toUpperCase() as Theme;
      return (['WORK','LOVE','FUTURE','LIFE'] as Theme[]).includes(t) ? t : 'LOVE';
    } catch {
      return 'LOVE';
    }
  }, []);

  // ---- 質問のロード（POSTでthemeを渡す。失敗時はGETにフォールバック）----
  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setResult(null);

    try {
      const t = await fetchTheme();
      setTheme(t);

      // まずは POST で theme を渡す（サーバ側が対応していればこちらが採用される）
      let res: Response | null = null;
      try {
        res = await fetch('/api/daily/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: t }),
          cache: 'no-store',
        });
      } catch {
        /* noop */
      }

      // POST が無い／405 の場合は GET を使用
      if (!res || !res.ok) {
        res = await fetch('/api/daily/question', { cache: 'no-store' });
      }

      const json = (await res.json()) as DailyQuestionResponse;
      if (!json.ok) throw new Error(json.error || 'failed_to_load');

      // サーバが補正した theme が返ってきたらそれを採用（完全同期）
      const fixedTheme = (json.theme || t) as Theme;
      setTheme(fixedTheme);

      setSlot(json.slot);
      setSeed(typeof json.seed === 'number' ? json.seed : null);
      setQuestion(json.question);
      setChoices(json.choices ?? []);
      setPhase('ask');
    } catch (e: any) {
      setErr(e?.message ?? 'failed_to_load');
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }, [fetchTheme]);

  useEffect(() => { loadQuestion(); }, [loadQuestion]);

  // ---- 選択→診断（必ず theme を同梱）----
  async function onChoose(choiceId: string) {
    if (seed === null) {
      setErr('seed_not_initialized'); setPhase('error'); return;
    }
    setLoading(true);
    setErr(null);
    try {
      const r = await fetch('/api/daily/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seed, choiceId, theme, env: 'prod' }),
      });
      const json = (await r.json()) as DailyAnswerResponse;
      if (!json.ok) throw new Error(json?.error ?? 'failed');
      setResult(json);
      setPhase('result');
    } catch (e: any) {
      setErr(e?.message ?? 'failed_to_answer'); setPhase('error');
    } finally {
      setLoading(false);
    }
  }

  const header = useMemo(() => {
    const s = slot==='morning'?'朝':slot==='noon'?'昼':slot==='night'?'夜':'';
    const t = theme==='WORK'?'仕事':theme==='LOVE'?'愛':theme==='FUTURE'?'未来':'生活';
    return `デイリー診断（${[s,t].filter(Boolean).join(' × ')}）`;
  }, [slot, theme]);

  return (
    <div className="max-w-xl mx-auto px-4 py-10 text-gray-100">
      <h1 className="text-2xl font-semibold mb-6">{header}</h1>

      {loading && <p className="opacity-80">読み込み中…</p>}

      {phase === 'error' && !loading && (
        <div className="space-y-3">
          <p className="text-red-400">エラー：{err}</p>
          <button
            type="button"
            className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
            onClick={loadQuestion}
          >
            もう一度読み込む
          </button>
        </div>
      )}

      {phase === 'ask' && !loading && (
        <div className="space-y-4">
          <p className="opacity-90">{question}</p>
          <div className="grid gap-3 mt-4">
            {choices.map((c) => (
              <button
                key={c.id}
                type="button"
                className="px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-left disabled:opacity-60"
                onClick={() => onChoose(c.id)}
                disabled={loading}
              >
                {c.label}
              </button>
            ))}
            {choices.length === 0 && (
              <div className="text-sm opacity-70">選択肢が取得できませんでした。</div>
            )}
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

          <div className="text-sm opacity-70">
            {result.save_error
              ? <span className="text-red-400">保存に失敗しました：{result.save_error}</span>
              : <span>自動保存しました。下のボタンからマイページへ戻れます。</span>}
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20"
              onClick={loadQuestion}
            >
              最初からもう一度
            </button>
            <button
              type="button"
              className="px-4 py-2 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white"
              onClick={() => router.push('/mypage')}
            >
              マイページへ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
