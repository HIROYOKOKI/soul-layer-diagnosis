"use client";

import Client from "./Client"

/* ─────────────────────────────
   型
   ───────────────────────────── */
type EV = "E" | "V" | "Λ" | "Ǝ";

type QChoice =
  | string
  | { code: EV | "A" | "∃" | "ヨ"; label: string }  // 新API想定
  | { code?: string; label?: string };              // 互換

type QResp = {
  ok: boolean;
  question?: unknown;
  // 2/3/4択どれでもOK（文字列 or {code,label} 混在も許容）
  choices?: QChoice[];
  // 今回出題対象のコード集合（例: ["E","Λ"]）※無くても動く
  subset?: string[];
  seed?: string | number;
  error?: string;
};

type DReq = { choice: string; theme?: string };
type DResp = {
  ok: boolean;
  code?: string;
  comment?: unknown;
  quote?: unknown;        // 互換（APIはaffirmationも返す）
affirmation?: unknown;  // 新
  navigator?: string | null;
  error?: string;
};

type SaveResp = { ok: boolean; item?: any; error?: string };

/* ─────────────────────────────
   ユーティリティ
   ───────────────────────────── */
const safeText = (v: unknown) =>
  typeof v === "string" || typeof v === "number"
    ? String(v)
    : v == null
    ? ""
    : (() => {
        try { return JSON.stringify(v) } catch { return String(v) }
      })();

/** API⇄UIのコード表記を正規化 */
function normalizeCode(x?: string | null): EV | null {
  const s = (x || "").trim();
  if (s === "∃" || s === "ヨ") return "Ǝ";
  if (s === "A") return "Λ";
  if (["E", "V", "Λ", "Ǝ"].includes(s)) return s as EV;
  return null;
}

/** ローカル保存に使う dev/prod テーマ識別 */
function getEnvForLog() {
   try {
     if (typeof localStorage === "undefined") return "dev"
     const v = (localStorage.getItem("ev-env") || "dev").toLowerCase()
     return v === "prod" ? "prod" : "dev"
   } catch { return "dev" }
 }

/** JSTの現在日時（UTC+9） */
function jstNow() {
  return new Date(Date.now() + 9 * 60 * 60 * 1000);
}

/** JST基準のスロット（朝A/昼B/夜C） */
function currentSlot(): "A" | "B" | "C" {
  const h = jstNow().getUTCHours();
  if (h < 12) return "A";
  if (h < 18) return "B";
  return "C";
}

/** YYYY-MM-DD（JST） */
function jstYmd() {
  const d = jstNow();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** question_id をJSTで統一 */
function buildQuestionId(slot: "A" | "B" | "C") {
  return `daily-${jstYmd()}-${slot}`;
}

/** /api/daily/save 用 */
async function saveDaily({
  questionId, subset, finalChoice, firstChoice, changes, env="dev"
 }:{
   questionId: string
   subset?: ("E"|"V"|"Λ"|"Ǝ")[]
   finalChoice: "E"|"V"|"Λ"|"Ǝ"
   firstChoice?: "E"|"V"|"Λ"|"Ǝ"|null
   changes: number
   env?: "dev"|"prod"
 }) {
  const res = await fetch("/api/daily/save", {
    method:"POST",
    headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({
      question_id: questionId,
      subset,
      final_choice: finalChoice,
      first_choice: firstChoice ?? null,
      changes,
       env       // ★ ここで env を送る（theme は送らない）
    })
  });
  return res.json() as Promise<SaveResp>;
}

/* 選び直しトラッカー（β：first/final/changesのみ） */
function useChoiceTrack<Code extends string>() {
  const first = useRef<Code | null>(null);
  const [finalChoice, setFinal] = useState<Code | null>(null);
  const changes = useRef(0);
  function choose(code: Code) {
    if (!first.current) first.current = code;
    if (finalChoice && finalChoice !== code) changes.current += 1;
    setFinal(code);
  }
  return {
    firstChoice: first.current,
    finalChoice,
    changes: changes.current,
    choose,
    reset() {
      first.current = null;
      changes.current = 0;
      setFinal(null);
    },
  };
}

/* ─────────────────────────────
   ページ本体
   ───────────────────────────── */
export default function Page() {
  return <Client />;
}
 const env = useMemo(getEnvForLog, [])
  const slot = useMemo(currentSlot, []); // マウント時点のslotを固定
  const questionId = useMemo(() => buildQuestionId(slot), [slot]);

  // 表示状態
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState<string>("");
  const [subset, setSubset] = useState<EV[] | null>(null);

  // 選択肢は {code,label} に正規化して保持
  const [options, setOptions] = useState<Array<{ code: EV; label: string }>>([]);

  // 選択状態（ラベルではなく code を採用：2/3/4択で安定）
  const {
    firstChoice,
    finalChoice,
    changes,
    choose,
    reset: resetTrack,
  } = useChoiceTrack<EV>();

  const [diagLoading, setDiagLoading] = useState(false);
  const [result, setResult] = useState<{ code: EV; comment: string; affirmation?: string; quote?: string } | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /* 1) 質問の取得（slotに応じた出題。2/3/4択OK） */
  const fetchQuestion = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    resetTrack();
    try {
      const res = await fetch(`/api/lunea/question?slot=${slot}`, { cache: "no-store" });
      const data: QResp = await res.json();
      if (!data.ok) throw new Error(data.error || "failed_question");

      const question = safeText(data.question) || "きょうの直感で選んでください。";
      setQ(question);

      // subset（あれば）をEVに正規化（ローカル変数 sub を以後の処理で優先使用）
      const sub = Array.isArray(data.subset)
        ? (data.subset
            .map((s) => normalizeCode(String(s)))
            .filter(Boolean) as EV[])
        : null;
      setSubset(sub && sub.length > 0 ? sub : null);

      // choices を {code,label}[] に正規化（2/3/4択どれでも）
      let raw = Array.isArray(data.choices) ? data.choices : [];
      // 文字列のみのとき、subset の順または既定順でコードを割り当てる
      const FALLBACK_ORDER: EV[] = ["E", "V", "Λ", "Ǝ"];

      const normalized: Array<{ code: EV; label: string }> = raw.map((r, idx) => {
        if (typeof r === "string") {
          const assigned =
            (sub && sub[idx]) ? sub[idx] :
            FALLBACK_ORDER[idx] ?? "E";
          return { code: assigned, label: safeText(r) };
        }
        const code = normalizeCode("code" in r ? (r.code as string | undefined) : undefined);
        const label = safeText("label" in r ? r.label : "");
        if (code) return { code, label };
        // codeが無い場合は subset/既定順で穴埋め
        const assigned =
          (sub && sub[idx]) ? sub[idx] :
          FALLBACK_ORDER[idx] ?? "E";
        return { code: assigned, label };
      });

      // subが来ていれば、それに含まれない選択肢は除外（※stateのsubsetではなく「今の sub」を使う）
      const filtered =
        (sub && sub.length > 0)
          ? normalized.filter((o) => sub.includes(o.code))
          : normalized;

      // 2/3/4択に正規化（最大4、最低2）
      const opts = filtered.slice(0, 4);
      if (opts.length < 2) {
        setOptions([
          { code: "E", label: "勢いで突破する" },
          { code: "Ǝ", label: "一度立ち止まって観察する" },
        ]);
      } else {
        setOptions(opts);
      }
    } catch (e: any) {
      setError(e?.message ?? "question_error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* 2) 診断の実行（選択は code ベースで送る） */
  const runDiagnose = async () => {
    if (!finalChoice) return;
    setDiagLoading(true);
    setError(null);
    try {
      const body: DReq = { choice: finalChoice, theme: env };
      const res = await fetch("/api/daily/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data: DResp = await res.json();
      if (!data.ok) throw new Error(data.error || "failed_diagnose");

      const code = normalizeCode(safeText(data.code)) || finalChoice;
      ssetResult({
     code,
     comment: safeText(data.comment),
     affirmation: safeText((data as any).affirmation),
     quote: safeText(data.quote), // 互換
   });

      (navigator as any)?.vibrate?.(8);
    } catch (e: any) {
      setError(e?.message ?? "diagnose_error");
    } finally {
      setDiagLoading(false);
    }
  };

  /* 3) 保存（β：first≠final のときだけ first に 0.25 を与えるのはサーバ側で） */
  const saveResult = async () => {
    if (!result || !finalChoice) return;
    setSaving(true);
    setError(null);
    try {
      const payload = {
        // 既存フィールド
        code: result.code,
        comment: result.comment,
        quote: result.affirmation || result.quote || "",
        mode: "daily",
        theme, // dev分離

        // β行動ログ＋スコア計算用
        question_id: questionId,                               // daily-YYYY-MM-DD-A/B/C（JST）
        subset: subset ?? options.map((o) => o.code),          // 今回の出題対象（2/3/4択）
        final_choice: finalChoice,                             // 最終選択（顕在）
        first_choice: firstChoice,                             // 初回選択（選び直しの痕跡）
        changes,                                               // 選び直し回数（βでは参考）
      };

      const data = await saveDaily({
  questionId,
   subset: payload.subset,
   finalChoice,
   firstChoice: firstChoice ?? null,
   changes,
   env,   // ★
 });

      if (!data.ok) throw new Error(data.error || "failed_save");
      window.location.href = "/mypage";
    } catch (e: any) {
      setError(e?.message ?? "save_error");
      setSaving(false);
    }
  };

  /* 表示ヘルパ */
  const codeBadge = (c: EV) => {
    const name =
      c === "E" ? "衝動・情熱" :
      c === "V" ? "可能性・夢" :
      c === "Λ" ? "選択・設計" :
      "観測・静寂";
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1">
        <span className="font-mono">{c}</span>
        <span className="text-xs text-white/70">{name}</span>
      </div>
    );
  };

  /* ─────────────────────────────
     UI
     ───────────────────────────── */
  return (
    <div className="min-h-[100svh] bg-black text-white">
      <main className="mx-auto max-w-xl px-5 py-8">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-semibold tracking-wide">デイリー診断</h1>
          <div className="text-xs text-white/60">
            Slot: {slot === "A" ? "朝" : slot === "B" ? "昼" : "夜"} / {questionId}
          </div>
        </div>
        <p className="text-sm text-white/60 mt-1">
          1日最大3回。いまの直感で選んでください。
        </p>

        {/* エラー */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
            うまく読み込めませんでした（{safeText(error)}）。もう一度お試しください。
          </div>
        )}

        {/* 質問カード */}
        <section className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-5">
          <div className="text-white/70 text-sm">今日の質問</div>
          <p className="mt-1 text-lg leading-relaxed">
            {loading ? "…生成中" : safeText(q)}
          </p>

          <div className="mt-4 grid grid-cols-1 gap-3">
            {options.map((o, i) => {
              const active = finalChoice === o.code;
              return (
                <button
                  key={`${o.code}-${i}`}
                  type="button"
                  disabled={loading || !!result}
                  onClick={() => choose(o.code)}
                  className={[
                    "w-full text-left rounded-xl px-4 py-3 border transition",
                    active
                      ? "border-white/70 bg-white/15 shadow-[0_0_0_2px_rgba(255,255,255,0.12)_inset]"
                      : "border-white/10 bg-white/5 hover:bg-white/8",
                  ].join(" ")}
                >
                  <span className="mr-2 opacity-70 font-mono">{o.code}</span>
                  {safeText(o.label)}
                </button>
              );
            })}
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={fetchQuestion}
              disabled={loading || diagLoading || saving}
              className="h-10 px-4 rounded-lg border border-white/15 bg-white/10 hover:bg-white/15 active:opacity-90"
            >
              もう一度ひらめきを見る
            </button>

            {!result ? (
              <button
                type="button"
                onClick={runDiagnose}
                disabled={!finalChoice || loading || diagLoading}
                className={[
                  "h-10 px-4 rounded-lg border border-white/10",
                  !finalChoice || loading || diagLoading
                    ? "bg-white/10 text-white/50"
                    : "bg-white text-black active:opacity-90",
                ].join(" ")}
              >
                {diagLoading ? "診断中…" : "結果を見る"}
              </button>
            ) : (
              <button
                type="button"
                onClick={saveResult}
                disabled={saving}
                className={[
                  "h-10 px-4 rounded-lg border border-emerald-400/20",
                  saving
                    ? "bg-emerald-500/30 text-white/70"
                    : "bg-emerald-400 text-black active:opacity-90",
                ].join(" ")}
              >
                {saving ? "保存中…" : "保存する（/mypageへ）"}
              </button>
            )}
          </div>
        </section>

        {/* 結果カード */}
        {result && (
          <section className="mt-6 space-y-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/60">今日のコード</div>
              <div className="mt-2 flex items-center gap-3">
                {codeBadge(result.code)}
              </div>
              <p className="mt-3 leading-relaxed">{safeText(result.comment)}</p>
            </div>

           {!!(result.affirmation || result.quote) && (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
              <div className="text-sm text-white/60">きょうのアファメーション</div>
                <blockquote className="mt-2 text-base leading-relaxed">
                  {safeText(result.affirmation || result.quote)}
                </blockquote>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
