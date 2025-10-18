// app/daily/page.tsx

import { redirect } from "next/navigation";
export const dynamic = "force-dynamic";

type Slot  = 'morning' | 'noon' | 'night';
type Theme = 'WORK' | 'LOVE' | 'FUTURE' | 'LIFE';
type Phase = 'ask' | 'result' | 'error';

type DailyQuestionResponse = {
  ok: boolean; error?: string;
  slot?: Slot; theme?: Theme; seed?: number;
  question?: string;
  choices?: Array<{ id?: string; key?: string; label?: string }>;
};

type DailyAnswerResponse = {
  ok: boolean; error?: string;
  comment: string; advice?: string; affirm?: string;
  score?: number;
  save_error?: string | null;
};

/* ===== クライアント側フォールバック ===== */
const FALLBACK: Record<Slot, { id: 'E'|'V'|'Λ'|'Ǝ'; label: string }[]> = {
  morning: [
    { id: 'E', label: '直感で素早く動く' },
    { id: 'V', label: '理想のイメージから始める' },
    { id: 'Λ', label: '条件を決めて選ぶ' },
    { id: 'Ǝ', label: '一拍置いて様子を見る' },
  ],
  noon: [
    { id: 'E', label: '勢いで一歩進める' },
    { id: 'V', label: '可能性を広げる選択をする' },
    { id: 'Λ', label: '目的に沿って最短を選ぶ' },
  ],
  night: [
    { id: 'Ǝ', label: '今日は観測と整理に徹する' },
    { id: 'V', label: '明日に向けて静かに構想する' },
  ],
};

const needCount = (s: Slot) => (s === 'morning' ? 4 : s === 'noon' ? 3 : 2);

/* JST 現在スロット（Asia/Tokyo で厳密に） */
function getJstSlot(): Slot {
  const h = Number(new Intl.DateTimeFormat('ja-JP', {
    timeZone: 'Asia/Tokyo',
    hour: 'numeric',
    hour12: false,
  }).format(new Date()));
  if (h >= 5 && h < 12) return 'morning';
  if (h >= 12 && h < 18) return 'noon';
  return 'night';
}

export default function Page() {
  redirect("/daily/question");
}
  const [phase, setPhase] = useState<Phase>('ask');
  const [loading, setLoading] = useState(false);

  // 表示・フォールバック判定に使う “信頼できる” スロット（クライアントで再判定）
  const [slot, setSlot] = useState<Slot>(getJstSlot());

  // ★ テーマ初期値を LOVE に統一（取得失敗でもズレない）
  const [theme, setTheme] = useState<Theme>('LOVE');

  const [seed, setSeed] = useState<number | null>(null);
  const [question, setQuestion] = useState('');
  const [choices, setChoices] = useState<{ id: string; label: string }[]>([]);
  const [result, setResult] = useState<DailyAnswerResponse | null>(null);
  const [err, setErr] = useState<string | null>(null);

  /* ---- MyPage と同じテーマを取得 ---- */
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

  /* ---- 質問のロード（POSTでthemeを渡す。失敗時はGETにフォールバック） ---- */
  const loadQuestion = useCallback(async () => {
    setLoading(true);
    setErr(null);
    setResult(null);

    try {
      // 1) テーマを固定
      const t = await fetchTheme();
      setTheme(t);

      // 2) 質問取得（まず POST → ダメなら GET）
      let res: Response | null = null;
      try {
        res = await fetch('/api/daily/question', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ theme: t }),
          cache: 'no-store',
        });
      } catch { /* noop */ }
      if (!res || !res.ok) {
        res = await fetch('/api/daily/question', { cache: 'no-store' });
      }

      const json = (await res!.json()) as DailyQuestionResponse;
      if (!json.ok) throw new Error(json.error || 'failed_to_load');

      // 3) スロットはサーバ値を使わず、クライアントで再判定して上書き
      const s = getJstSlot();
      setSlot(s);

      // 4) seed / question
      setSeed(typeof json.seed === 'number' ? json.seed : 0);
      setQuestion(
        (json.question ?? '').trim() ||
          (s === 'morning'
            ? '今のあなたに必要な最初の一歩はどれ？'
            : s === 'noon'
            ? 'このあと数時間で進めたい進路は？'
            : '今日はどんな締めくくりが心地いい？')
      );

      // 5) choices 正規化（id or key → id）＋ 強制フォールバック
      const need = needCount(s);
      let arr: { id: string; label: string }[] = Array.isArray(json.choices)
        ? json.choices
            .map((c) => ({
              id: String((c.id ?? c.key) ?? ''),
              label: typeof c.label === 'string' ? c.label.trim() : '',
            }))
            .filter((c) => c.id && c.label)
        : [];

      if (arr.length < need) {
        const have = new Set(arr.map((c) => c.id));
        for (const fb of FALLBACK[s]) {
          if (arr.length >= need) break;
          if (!have.has(fb.id)) arr.push(fb);
        }
      }
      if (arr.length === 0) arr = FALLBACK[s].slice(0, need);
      if (arr.length > need) arr = arr.slice(0, need);
      setChoices(arr);

      setPhase('ask');
    } catch (e: any) {
      setErr(e?.message ?? 'failed_to_load');
      setPhase('error');
    } finally {
      setLoading(false);
    }
  }, [fetchTheme]);

  useEffect(() => { loadQuestion(); }, [loadQuestion]);

  /* ---- 選択→診断（必ず theme を同梱） ---- */
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
