'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import ProfileIcon from "@/components/ui/ProfileIcon"; // 👈 先頭でimport（必須）

/**
 * MyPage（本番実装・API接続下地）
 * - API: /api/today, /api/series?days=7|30|90, /api/me
 * - Premiumでメッセージ↔アート切替可（FREEはロック＆アップセル）
 * - 中央は横スライド：レーダー / 折れ線（7/30/90タブ）
 * - 依存ライブラリ無し（SVGで描画）
 */
export default function MyPage() {
  const [plan, setPlan] = useState<"FREE" | "PREMIUM" | "UNKNOWN">("UNKNOWN");
  const [range, setRange] = useState<7 | 30 | 90>(30);
  const [showArt, setShowArt] = useState(false);
  const premium = plan === "PREMIUM";

  // --- 状態: プロフィール（最小表示） ---
  const [profile, setProfile] = useState<{ name: string; id: string; avatarUrl?: string } | null>(null);

  // --- 状態: 当日の合成スコア（レーダー用） ---
  const [today, setToday] = useState<EVAEVector | null>(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [todayErr, setTodayErr] = useState<string | null>(null);

  // --- 状態: 時系列（折れ線用） ---
  const [series, setSeries] = useState<SeriesPoint[] | null>(null);
  const [seriesLoading, setSeriesLoading] = useState(true);
  const [seriesErr, setSeriesErr] = useState<string | null>(null);

  // --- 状態: 最新メッセージ ---
  const [latest, setLatest] = useState<{ code: Code; text: string; date: string } | null>(null);

  // 初回＆range変化時にAPI取得
  useEffect(() => {
    const ac = new AbortController();

    // /api/me
    (async () => {
      try {
        const r = await fetch("/api/me", { signal: ac.signal });
        if (!r.ok) throw new Error("/api/me failed");
        const me = await r.json();
        setPlan((me?.plan?.toUpperCase?.() as any) === "PREMIUM" ? "PREMIUM" : "FREE");
        setProfile({ name: me?.name ?? "User", id: me?.id ?? "0001", avatarUrl: me?.avatarUrl });
      } catch (_err) {
        setPlan("FREE"); // 取得失敗時はFREE扱い
        setProfile({ name: "User", id: "0001" });
      }
    })();

    // /api/today
    (async () => {
      setTodayLoading(true);
      setTodayErr(null);
      try {
        const r = await fetch("/api/today", { signal: ac.signal });
        if (!r.ok) throw new Error("/api/today failed");
        const t = (await r.json()) as { scores: EVAEVector; latest?: { code: Code; text: string; date: string } };
        setToday(t.scores);
        setLatest(
          t.latest ?? {
            code: "Ǝ",
            text: "静かに観察したい",
            date: new Date().toISOString().slice(0, 10),
          }
        );
      } catch (err: unknown) {
        setToday(null);
        const msg = err instanceof Error ? err.message : "today fetch error";
        setTodayErr(msg);
      } finally {
        setTodayLoading(false);
      }
    })();

    // /api/series
    (async () => {
      setSeriesLoading(true);
      setSeriesErr(null);
      try {
        const r = await fetch(`/api/series?days=${range}`, { signal: ac.signal });
        if (!r.ok) throw new Error("/api/series failed");
        const s = (await r.json()) as SeriesPoint[];
        setSeries(s);
      } catch (err) {
        // フォールバック：ダミー生成
        setSeries(buildMockSeries(range));
        setSeriesErr(err instanceof Error ? err.message : "series fetch error");
      } finally {
        setSeriesLoading(false);
      }
    })();

    return () => ac.abort();
  }, [range]);

  // テーマ（文字のみ）→ /api/today から日付取得、なければ今日
  const theme = useMemo(() => ({ name: "self", date: new Date().toISOString().slice(0, 10) }), []);

  return (
    <div className="relative min-h-screen bg-black text-white overflow-hidden">
      {/* 背景の青光 */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-0 h-[130%] w-px -translate-x-1/2 bg-gradient-to-b from-cyan-400/40 via-blue-500/20 to-transparent" />
        <div className="absolute -top-1/4 left-1/2 -translate-x-1/2 w-[1200px] h-[1200px] rounded-full blur-3xl opacity-30 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.25),transparent_60%)]" />
      </div>

      {/* レイアウト幅の固定（はみ出し防止） */}
      <div className="relative mx-auto w-full max-w-[720px] px-4 py-8 grid gap-6">
        {/* ヘッダー（このページ内のローカル見出し） */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">MY PAGE</h1>
            <p className="text-white/60 text-sm">あなたの軌跡と、いまを映す</p>
          </div>
          <div className="flex items-center gap-3">
            <PlanPill plan={plan} />
            <button className="h-10 w-10 rounded-full grid place-items-center bg-white/6 hover:bg-white/10 transition" title="設定">
              <span aria-hidden className="text-sky-400 text-xl">⚙️</span>
            </button>
          </div>
        </header>

        {/* プロフィール（最小表示） */}
        <div className="flex items-center gap-3">
          <ProfileIcon src={profile?.avatarUrl} size={48} />
          <div>
            <p className="font-medium">{profile?.name}</p>
            <p className="text-xs text-white/60">ID: {profile?.id}</p>
          </div>
        </div>

        {/* テーマ（文字のみ） */}
        <div>
          <div className="text-sm text-white/60">現在のテーマ</div>
          <div className="text-xl font-semibold mt-1">{theme.name}</div>
          <div className="text-xs text-white/50">{theme.date}</div>
        </div>

        {/* メッセージ／アート（Premium切替） */}
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-white/80">直近のメッセージ</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => premium && setShowArt((s) => !s)}
                className={`rounded-full px-3 py-1 text-xs border border-white/10 ${premium ? "hover:bg-white/5" : "opacity-50 cursor-not-allowed"}`}
              >
                {showArt ? "メッセージ表示に戻す" : "アート表示に切替"}
              </button>
              {!premium && (
                <a href="#" className="text-xs text-cyan-300/90 hover:text-cyan-200">Premiumで解放 →</a>
              )}
            </div>
          </div>
          {showArt && premium ? (
            <ArtCard code={(latest?.code ?? "Ǝ") as Code} />
          ) : (
            <div className="flex items-center gap-3">
              <Badge>{latest?.code ?? "Ǝ"}</Badge>
              <div>
                <div className="text-base">{latest?.text ?? "静かに観察したい"}</div>
                <div className="text-xs text-white/60">{latest?.date ?? "—"}</div>
              </div>
            </div>
          )}
        </Card>

        {/* 中央：横スライド（レーダー／折れ線） */}
        <Slider>
          {/* レーダー */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/80">レーダーチャート（E / V / Λ / Ǝ）</h2>
              <div className="text-xs text-white/50">構造バランス</div>
            </div>
            {todayLoading ? (
              <Skeleton height={260} />
            ) : today ? (
              <RadarChart values={today} />
            ) : (
              <ErrorNote note={todayErr ?? "データが見つかりません"} />
            )}
          </Card>

          {/* 折れ線（7/30/90） */}
          <Card>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white/80">{range}日推移（E / V / Λ / Ǝ）</h2>
              <div className="flex items-center gap-2 text-xs">
                {[7, 30, 90].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r as 7 | 30 | 90)}
                    className={`px-2 py-1 rounded ${range === r ? "bg-cyan-500/30 text-cyan-200" : "text-white/60 hover:text-white/90"}`}
                    aria-pressed={range === r}
                  >
                    {r}日
                  </button>
                ))}
              </div>
            </div>
            {seriesLoading ? (
              <Skeleton height={240} />
            ) : series ? (
              <TimeSeriesChart data={series} />
            ) : (
              <ErrorNote note={seriesErr ?? "データが見つかりません"} />
            )}
          </Card>
        </Slider>

        {/* アクション */}
        <Card>
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <div className="text-white/70 text-sm">次の一歩を選んでください</div>
            <div className="flex gap-3">
              <button className="rounded-xl px-5 py-2 text-sm font-medium bg-white/5 border border-white/10 hover:bg-white/10">診断する</button>
              <button className="rounded-xl px-5 py-2 text-sm font-medium bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110 shadow-[0_0_30px_rgba(34,211,238,0.25)]">診断タイプを選ぶ</button>
            </div>
          </div>
        </Card>

        {/* フッター：現在のステータス */}
        <footer className="pt-6 text-center text-xs text-white/40">
          <div className="mb-2 text-white/70">現在のステータス: {premium ? "Premium" : "FREE"}</div>
          {!premium && (
            <div className="mb-3 text-xs text-white/60">診断履歴保存は直近3件まで ・ 高度分析/アート表示 未解放</div>
          )}
          {!premium && (
            <button
              onClick={() => setPlan("PREMIUM")}
              className="rounded-xl px-4 py-2 text-sm font-medium bg-gradient-to-r from-cyan-400 to-blue-600 hover:brightness-110 shadow-[0_0_30px_rgba(34,211,238,0.25)]"
            >
              Premiumにアップグレード
            </button>
          )}
          <div className="mt-4 text-white/40">EVΛƎ Project — MyPage</div>
        </footer>
      </div>
    </div>
  );
}

/* ===================== */
/* 型・ユーティリティ   */
/* ===================== */
type Code = "E" | "V" | "Λ" | "Ǝ";
type EVAEVector = { E: number; V: number; L: number; Eexists: number };
type SeriesPoint = { date: string } & EVAEVector;

function clamp01(v: number) { return Math.max(0, Math.min(1, v)); }

/* ============ */
/* UIパーツ類  */
/* ============ */
function Card({ children }: { children: ReactNode }) {
  return (
    <section className="relative w-full max-w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-4 md:p-5 shadow-[0_0_40px_rgba(59,130,246,0.08)]">
      <div className="pointer-events-none absolute inset-0 rounded-2xl ring-1 ring-inset ring-white/5" />
      {children}
    </section>
  );
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500/30 to-blue-700/30 border border-cyan-300/30 text-cyan-200 text-base font-semibold shadow-[0_0_30px_rgba(56,189,248,0.25)]">
      {children}
    </span>
  );
}

function PlanPill({ plan }: { plan: "FREE" | "PREMIUM" | "UNKNOWN" }) {
  const label = plan === "UNKNOWN" ? "—" : plan;
  return (
    <span className="text-[11px] px-2 py-1 rounded-full border border-white/10 bg-white/5 text-white/70">{label}</span>
  );
}

function Skeleton({ height }: { height: number }) {
  return <div className="w-full rounded-xl bg-white/5 animate-pulse" style={{ height }} />;
}

function ErrorNote({ note }: { note: string }) {
  return <div className="text-sm text-red-300/80">{note}</div>;
}

/* ==================== */
/* レーダーチャート    */
/* ==================== */
function RadarChart({ values }: { values: EVAEVector }) {
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 100;
  const axes = [
    { label: "E", angle: -90 },
    { label: "V", angle: 0 },
    { label: "Λ", angle: 90 },
    { label: "Ǝ", angle: 180 },
  ];
  const vals = [values.E, values.V, values.L, values.Eexists];

  function polar(angleDeg: number, radiusScale: number) {
    const rad = (Math.PI / 180) * angleDeg;
    const rr = r * clamp01(radiusScale);
    return [cx + rr * Math.cos(rad), cy + rr * Math.sin(rad)];
  }

  const points = axes.map((a, i) => polar(a.angle, vals[i])).map(([x, y]) => `${x},${y}`).join(" ");

  return (
    <div className="w-full flex items-center justify-center">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="drop-shadow-[0_0_20px_rgba(56,189,248,0.15)]">
        {[0.25, 0.5, 0.75, 1].map((t) => (<circle key={t} cx={cx} cy={cy} r={r * t} className="fill-none stroke-white/10" />))}
        {axes.map((a) => {
          const [x, y] = polar(a.angle, 1);
          return (
            <g key={a.label}>
              <line x1={cx} y1={cy} x2={x} y2={y} className="stroke-white/15" />
              <text x={x} y={y} dy={a.angle === 90 ? 12 : a.angle === -90 ? -6 : 4} className="fill-white/70 text-[12px]">{a.label}</text>
            </g>
          );
        })}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%">
            <stop offset="0%" stopColor="rgba(56,189,248,0.5)" />
            <stop offset="100%" stopColor="rgba(56,189,248,0.0)" />
          </radialGradient>
          <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
          </filter>
        </defs>
        <polygon points={points} fill="url(#glow)" filter="url(#blur)" />
        <polygon points={points} className="fill-cyan-400/25 stroke-cyan-300/50" />
      </svg>
    </div>
  );
}

/* ==================== */
/* 折れ線グラフ        */
/* ==================== */
function TimeSeriesChart({ data }: { data: SeriesPoint[] }) {
  const width = data.length * 28 + 80; // 7/30/90対応
  const height = 240;
  const pad = { l: 48, r: 40, t: 12, b: 36 };

  const x = (i: number) => pad.l + i * 28;
  const y = (v: number) => pad.t + (height - pad.t - pad.b) * (1 - clamp01(v));
  const line = (points: number[]) => points.map((v, i) => `${x(i)},${y(v)}`).join(" ");
  const colors = { E: "#fb7185", V: "#38bdf8", L: "#86efac", Eexists: "#a78bfa" } as const;

  function idxFromClient(evt: React.MouseEvent<SVGSVGElement> | React.TouchEvent<SVGSVGElement>) {
    const svg = evt.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clientX = "touches" in evt ? (evt.touches[0]?.clientX ?? 0) : (evt as React.MouseEvent).clientX;
    const px = clientX - rect.left;
    const i = Math.round((px - pad.l) / 28);
    return Math.max(0, Math.min(data.length - 1, i));
  }

  const [hover, setHover] = useState<number | null>(null);

  return (
    <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <svg
        width={width}
        height={height}
        className="block touch-pan-x"
        onMouseMove={(e) => setHover(idxFromClient(e))}
        onMouseLeave={() => setHover(null)}
        onTouchStart={(e) => setHover(idxFromClient(e))}
        onTouchMove={(e) => setHover(idxFromClient(e))}
        onTouchEnd={() => setHover(null)}
      >
        {/* 軸 */}
        <line x1={pad.l} y1={y(0)} x2={width - pad.r} y2={y(0)} className="stroke-white/15" />
        <line x1={pad.l} y1={pad.t} x2={pad.l} y2={height - pad.b} className="stroke-white/15" />
        {/* 目盛り */}
        {[0, 0.5, 1].map((v) => (
          <g key={v}>
            <line x1={pad.l} y1={y(v)} x2={width - pad.r} y2={y(v)} className="stroke-white/5" />
            <text x={8} y={y(v) + 4} className="fill-white/40 text-[10px]">{v.toFixed(1)}</text>
          </g>
        ))}
        {/* 日付（5日おき） */}
        {data.map((d, i) => (i % 5 === 0 ? <text key={i} x={x(i)} y={height - 10} className="fill-white/40 text-[10px]">{d.date.slice(5)}</text> : null))}

        {/* 折れ線 */}
        <polyline fill="none" stroke={colors.E} strokeOpacity="0.9" strokeWidth={2} points={line(data.map((d) => d.E))} />
        <polyline fill="none" stroke={colors.V} strokeOpacity="0.9" strokeWidth={2} points={line(data.map((d) => d.V))} />
        <polyline fill="none" stroke={colors.L} strokeOpacity="0.9" strokeWidth={2} points={line(data.map((d) => d.L))} />
        <polyline fill="none" stroke={colors.Eexists} strokeOpacity="0.9" strokeWidth={2} points={line(data.map((d) => d.Eexists))} />

        {/* ホバー（縦ガイド＋ドット＋ツールチップ） */}
        {hover !== null && (
          <g>
            <line x1={x(hover)} y1={pad.t} x2={x(hover)} y2={height - pad.b} className="stroke-white/30" />
            {(["E", "V", "L", "Eexists"] as const).map((k) => {
              const val = data[hover][k];
              const cx = x(hover);
              const cy = y(val);
              const fill = (colors as Record<string, string>)[k];
              return <circle key={k} cx={cx} cy={cy} r={3.5} fill={fill} />;
            })}
            {(() => {
              const d = data[hover];
              const boxX = Math.min(Math.max(x(hover) + 8, pad.l), width - pad.r - 120);
              const boxY = pad.t + 8;
              return (
                <g>
                  <rect x={boxX} y={boxY} width={120} height={68} rx={8} className="fill-black/80 stroke-white/15" />
                  <text x={boxX + 8} y={boxY + 14} className="fill-white text-[10px]">{d.date}</text>
                  <text x={boxX + 8} y={boxY + 28} className="fill-white/80 text-[10px]">E: {d.E.toFixed(2)}</text>
                  <text x={boxX + 8} y={boxY + 40} className="fill-white/80 text-[10px]">V: {d.V.toFixed(2)}</text>
                  <text x={boxX + 8} y={boxY + 52} className="fill-white/80 text-[10px]">Λ: {d.L.toFixed(2)}</text>
                  <text x={boxX + 8} y={boxY + 64} className="fill-white/80 text-[10px]">Ǝ: {d.Eexists.toFixed(2)}</text>
                </g>
              );
            })()}
          </g>
        )}

        {/* 凡例 */}
        <g>
          <circle cx={width - pad.r - 112} cy={16} r={4} fill={colors.E} />
          <text x={width - pad.r - 104} y={20} className="fill-white/70 text-[10px]">E</text>
          <circle cx={width - pad.r - 82} cy={16} r={4} fill={colors.V} />
          <text x={width - pad.r - 74} y={20} className="fill-white/70 text-[10px]">V</text>
          <circle cx={width - pad.r - 52} cy={16} r={4} fill={colors.L} />
          <text x={width - pad.r - 44} y={20} className="fill-white/70 text-[10px]">Λ</text>
          <circle cx={width - pad.r - 22} cy={16} r={4} fill={colors.Eexists} />
          <text x={width - pad.r - 14} y={20} className="fill-white/70 text-[10px]">Ǝ</text>
        </g>
      </svg>
    </div>
  );
}

/* ==================== */
/* スライダー           */
/* ==================== */
function Slider({ children }: { children: ReactNode }) {
  return (
    <div className="relative">
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {Array.isArray(children) ? (
          (children as ReactNode[]).map((child, i) => (
            <div key={i} className="min-w-full snap-center">
              {child}
            </div>
          ))
        ) : (
          <div className="min-w-full snap-center">{children}</div>
        )}
      </div>
      <div className="mt-1 flex items-center justify-center gap-2">
        <span className="w-2 h-2 rounded-full bg-white/30"></span>
        <span className="w-2 h-2 rounded-full bg-white/30"></span>
      </div>
    </div>
  );
}

/* ==================== */
/* アート（Premium）    */
/* ==================== */
function ArtCard({ code }: { code: Code }) {
  const palette =
    code === "E" ? ["#fb923c", "#f97316", "#ea580c"]
    : code === "V" ? ["#22d3ee", "#06b6d4", "#0891b2"]
    : code === "Λ" ? ["#a3e635", "#84cc16", "#65a30d"]
    : ["#a78bfa", "#7c3aed", "#312e81"];

  return (
    <div className="relative h-48 overflow-hidden rounded-xl border border-white/10 bg-black/40">
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 600 240">
        {Array.from({ length: 30 }).map((_, i) => (
          <circle key={i} cx={20 * i + 10} cy={(Math.sin(i / 3) * 40 + 80) + (i % 2 ? 20 : -10)} r={8} fill={palette[i % palette.length]} opacity={0.35} />
        ))}
        {Array.from({ length: 18 }).map((_, i) => (
          <rect key={`r${i}`} x={30 * i} y={160 + Math.sin(i) * 10} width={18} height={18} fill={palette[(i + 1) % palette.length]} opacity={0.25} />
        ))}
      </svg>
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-cyan-400/10 to-blue-600/10" />
      <div className="absolute inset-0 blur-3xl bg-[radial-gradient(circle_at_60%_50%,rgba(56,189,248,0.25),transparent_50%)]" />
      <div className="absolute bottom-2 right-3 text-[10px] text-white/50">ミリデュームアート</div>
    </div>
  );
}

/* ==================== */
/* ダミー系列生成       */
/* ==================== */
function buildMockSeries(days: number = 30): SeriesPoint[] {
  const W_PROFILE = 1.0, W_THEME = 0.5, W_QUICK = 1.2, W_DAILY = 0.1, W_WEEKLY = 0.5, W_MONTHLY = 1.5;

  let seed = 42;
  const rand = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 2 ** 32; };
  const today = new Date();
  const daysCount = Math.max(1, Math.floor(days));
  const series: SeriesPoint[] = [];

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);

    const profile = { E: 0.6, V: 0.6, L: 0.6, Eexists: 0.6 };
    const theme   = { E: rand(), V: rand(), L: rand(), Eexists: rand() };
    const quick   = { E: rand(), V: rand(), L: rand(), Eexists: rand() };
    const daily   = { E: rand(), V: rand(), L: rand(), Eexists: rand() };
    const weeklyBoost = d.getDay() === 0 ? 1 : 0;
    const weekly  = { E: rand() * weeklyBoost, V: rand() * weeklyBoost, L: rand() * weeklyBoost, Eexists: rand() * weeklyBoost };
    const monthlyBoost = d.getDate() === 1 ? 1 : 0;
    const monthly = { E: rand() * monthlyBoost, V: rand() * monthlyBoost, L: rand() * monthlyBoost, Eexists: rand() * monthlyBoost };

    const denom = W_PROFILE + W_THEME + W_QUICK + W_DAILY + W_WEEKLY + W_MONTHLY;
    const combine = (p: number, t: number, q: number, da: number, w: number, m: number) =>
      clamp01((W_PROFILE * p + W_THEME * t + W_QUICK * q + W_DAILY * da + W_WEEKLY * w + W_MONTHLY * m) / denom);

    const E = combine(profile.E, theme.E, quick.E, daily.E, weekly.E, monthly.E);
    const V = combine(profile.V, theme.V, quick.V, daily.V, weekly.V, monthly.V);
    const L = combine(profile.L, theme.L, quick.L, daily.L, weekly.L, monthly.L);
    const Eexists = combine(profile.Eexists, theme.Eexists, quick.Eexists, daily.Eexists, weekly.Eexists, monthly.Eexists);

    series.push({ date, E, V, L, Eexists });
  }
  return series;
}

/* ==================== */
/* テスト（console）    */
/* ==================== */
if (typeof window !== "undefined") {
  const s = buildMockSeries();
  console.assert(s.length === 30, "series length=30");
  console.assert(s.every(d => d.E>=0 && d.E<=1 && d.V>=0 && d.V<=1 && d.L>=0 && d.L<=1 && d.Eexists>=0 && d.Eexists<=1), "values in [0,1]");
  const s7 = buildMockSeries(7), s90 = buildMockSeries(90);
  console.assert(s7.length === 7 && s90.length === 90, "7/90 supported");
  const asc = s.every((d,i,a)=> i===0 || d.date >= a[i-1].date);
  console.assert(asc, "ascending dates");
}
