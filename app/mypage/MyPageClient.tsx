"use client"

import React, { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"

/* =========================
   Types
   ========================= */
type EV = "E" | "V" | "Λ" | "Ǝ"

type ProfileLatest = {
  fortune?: string | null
  personality?: string | null
  partner?: string | null
  created_at?: string
  base_model?: "EΛVƎ" | "EVΛƎ" | null
  base_order?: EV[] | null
}

type DailyLatest = { code?: string | null; comment?: string | null; quote?: string | null; created_at?: string }

// Charts types
type EVAEVector = { E: number; V: number; Eexists: number; L?: number; ["Λ"]?: number }
type SeriesPoint = { date: string; E: number; V: number; L: number; Eexists: number }

/* =========================
   Utils
   ========================= */
function toTypeLabel(model?: string | null) {
  if (model === "EΛVƎ") return "現実思考型"
  if (model === "EVΛƎ") return "未来志向型"
  return null
}
function fmt(dt?: string) {
  try {
    const d = dt ? new Date(dt) : new Date()
    return new Intl.DateTimeFormat("ja-JP", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).format(d)
  } catch { return "" }
}
const FALLBACK_USER = { name: "Hiro", idNo: "0001", avatar: "/icon-512.png" }
const CURRENT_THEME = "self"

// palette
const PALETTE = { E: "#FF4500", V: "#1E3A8A", L: "#84CC16", Eexists: "#B833F5" } as const
const TICK_COLOR = "rgba(255,255,255,0.10)"

// helpers
function clamp01(v: unknown) { const n = typeof v === "number" ? v : Number(v); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0 }
function valForLabel(values: EVAEVector, label: EV) {
  if (label === "E") return clamp01(values.E)
  if (label === "V") return clamp01(values.V)
  if (label === "Λ") return clamp01(values["Λ"] ?? values.L)
  return clamp01(values.Eexists) // Ǝ
}
function dominantKey(values: EVAEVector): EV {
  const arr: Array<[EV, number]> = [["E", valForLabel(values,"E")], ["V", valForLabel(values,"V")], ["Λ", valForLabel(values,"Λ")], ["Ǝ", valForLabel(values,"Ǝ")]]
  arr.sort((a,b)=>b[1]-a[1]); return arr[0][0]
}
function normalizeToday(v: any): EVAEVector {
  const L = typeof v?.L === "number" ? v.L : (typeof v?.["Λ"] === "number" ? v["Λ"] : 0)
  return { E: Number(v?.E ?? 0), V: Number(v?.V ?? 0), L, ["Λ"]: undefined, Eexists: Number(v?.Eexists ?? v?.["Ǝ"] ?? 0) }
}
function normalizeSeries(list: any[]): SeriesPoint[] {
  return (list ?? []).map((d) => ({
    date: String(d?.date ?? "").slice(0,10),
    E: Number(d?.E ?? 0), V: Number(d?.V ?? 0),
    L: Number(d?.L ?? d?.["Λ"] ?? 0),
    Eexists: Number(d?.Eexists ?? d?.["Ǝ"] ?? 0),
  }))
}

/* =========================
   Charts: Radar
   ========================= */
function RadarChart({ values }: { values: EVAEVector }) {
  const size = 300, cx = size/2, cy = size/2, r = 115
  const axes: Array<{label:EV; angle:number; color:string}> = [
    { label:"E", angle:-90, color:PALETTE.E },
    { label:"V", angle:0,   color:PALETTE.V },
    { label:"Λ", angle:90,  color:PALETTE.L },
    { label:"Ǝ", angle:180, color:PALETTE.Eexists },
  ]
  const polar = (ang:number, s:number) => {
    const rad = ang * Math.PI/180, rr = r * clamp01(s)
    return [cx + rr*Math.cos(rad), cy + rr*Math.sin(rad)] as const
  }
  const pts = axes.map(a => polar(a.angle, valForLabel(values, a.label)))
  const points = pts.map(([x,y]) => `${x},${y}`).join(" ")
  const dom = dominantKey(values)
  const fillColor = dom==="E"?PALETTE.E:dom==="V"?PALETTE.V:dom==="Λ"?PALETTE.L:PALETTE.Eexists

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {[0.25,0.5,0.75,1].map(t=>(
        <circle key={t} cx={cx} cy={cy} r={r*t} fill="none" stroke="rgba(255,255,255,0.12)" />
      ))}
      {axes.map(a=>{
        const [x,y]=polar(a.angle,1)
        return (
          <g key={a.label}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.15)" />
            <text x={x} y={y} dy={a.angle===90?12:a.angle===-90?-6:4} fontSize={13} fontWeight={700} fill={a.color}>{a.label}</text>
          </g>
        )
      })}
      {/* glow */}
      <defs>
        <radialGradient id="glow" cx="50%" cy="50%">
          <stop offset="0%" stopColor="rgba(184,51,245,0.40)" />
          <stop offset="100%" stopColor="rgba(184,51,245,0.00)" />
        </radialGradient>
        <filter id="blur" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="6" />
        </filter>
      </defs>
      <polygon points={points} fill="url(#glow)" filter="url(#blur)" />
      {/* 縁は Ǝ 紫のまま */}
      <polygon points={points} fill={fillColor} opacity={0.25} stroke={PALETTE.Eexists} strokeOpacity={0.5} />
    </svg>
  )
}

/* =========================
   Charts: Line
   ========================= */
function TimeSeriesChart({ data }: { data: SeriesPoint[] }) {
  const step=28, width=data.length*step+80, height=260
  const pad={l:56,r:46,t:18,b:40}
  const x=(i:number)=> pad.l + i*step
  const y=(v:number)=> pad.t+(height-pad.t-pad.b)*(1-clamp01(v))
  const line=(arr:number[])=> arr.map((v,i)=>`${x(i)},${y(v)}`).join(" ")
  const colors={E:PALETTE.E,V:PALETTE.V,L:PALETTE.L,Eexists:PALETTE.Eexists}
  const ticksY=[0,0.25,0.5,0.75,1]
  const vStep=Math.max(1,Math.ceil(data.length/10))

  return (
    <svg width={width} height={height}>
      {/* axes */}
      <line x1={pad.l} y1={y(0)} x2={width-pad.r} y2={y(0)} stroke={TICK_COLOR}/>
      <line x1={pad.l} y1={pad.t} x2={pad.l} y2={height-pad.b} stroke={TICK_COLOR}/>
      {/* horizontal grid */}
      {ticksY.map(ty=> (<line key={ty} x1={pad.l} y1={y(ty)} x2={width-pad.r} y2={y(ty)} stroke={TICK_COLOR}/>))}
      {/* vertical grid */}
      {Array.from({length:data.length},(_,i)=> i%vStep===0 ? (
        <line key={`vg-${i}`} x1={x(i)} y1={pad.t} x2={x(i)} y2={height-pad.b} stroke="rgba(255,255,255,0.06)"/>
      ):null)}
      {/* series */}
      <polyline fill="none" stroke={colors.E} strokeWidth={2} points={line(data.map(d=>d.E))}/>
      <polyline fill="none" stroke={colors.V} strokeWidth={2} points={line(data.map(d=>d.V))}/>
      <polyline fill="none" stroke={colors.L} strokeWidth={2} points={line(data.map(d=>d.L))}/>
      <polyline fill="none" stroke={colors.Eexists} strokeWidth={2} points={line(data.map(d=>d.Eexists))}/>
    </svg>
  )
}

export default function MyPageClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileLatest | null>(null)
  const [daily, setDaily] = useState<DailyLatest | null>(null)

  // charts states
  const [range, setRange] = useState<7|30|90>(30)  // 要件：初期30日
  const [today, setToday] = useState<EVAEVector | null>(null)
  const [series, setSeries] = useState<SeriesPoint[] | null>(null)
  const [chartsErr, setChartsErr] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        setError(null); setLoading(true)
        const [p, d] = await Promise.all([
          fetch("/api/mypage/profile-latest", { cache: "no-store" }).then(r => r.json()),
          fetch("/api/mypage/daily-latest",   { cache: "no-store" }).then(r => r.json()),
        ])
        if (!alive) return
        if (!p?.ok) throw new Error(p?.error || "profile_latest_failed")
        if (!d?.ok) throw new Error(d?.error || "daily_latest_failed")
        setProfile(p.item ?? null)
        setDaily(d.item ?? null)
      } catch (e:any) {
        if (alive) setError(e?.message || "failed")
      } finally {
        if (alive) setLoading(false)
      }
    })()
    return () => { alive = false }
  }, [])

  // charts fetcher
  useEffect(() => {
    let alive = true
    ;(async ()=> {
      try {
        setChartsErr(null)
        const [tRes, sRes] = await Promise.all([
          fetch("/api/today", { cache: "no-store" }),
          fetch(`/api/series?days=${range}`, { cache: "no-store" }),
        ])
        if (!tRes.ok) throw new Error("/api/today failed")
        if (!sRes.ok) throw new Error("/api/series failed")
        const tJson = await tRes.json()
        const sJson = await sRes.json()
        if (!alive) return
        setToday(normalizeToday(tJson?.scores ?? tJson))
        setSeries(normalizeSeries(sJson))
      } catch(e:any) {
        if (!alive) return
        setChartsErr(e?.message ?? "charts fetch error")
        // fallback: safe constant values
        const d = new Date()
        const mock = Array.from({length:range},(_,i)=> {
          const dt = new Date(d); dt.setDate(dt.getDate()-(range-1-i))
          return { date: dt.toISOString().slice(0,10), E:0.6, V:0.6, L:0.6, Eexists:0.6 }
        })
        setToday({E:0.6,V:0.6,L:0.6,Eexists:0.6})
        setSeries(mock)
      }
    })()
    return ()=>{ alive=false }
  }, [range])

  const typeLabel = toTypeLabel(profile?.base_model)
  const nowStr = fmt()

  const goDaily = () => router.push("/daily/question")
  const goSettings = () => router.push("/settings")

  return (
    <div className="min-h-screen bg-black text-white px-5 py-6 max-w-md mx-auto">
      {/* 1) クイック診断の型（上部中央） */}
      <div className="text-center mb-3">
        <span className={`inline-block rounded-lg px-3 py-1 text-sm border
          ${profile?.base_model === "EΛVƎ"
            ? "border-cyan-400/30 bg-cyan-400/15 text-cyan-200"
            : "border-pink-400/30 bg-pink-400/15 text-pink-200"}`}>
          {typeLabel ?? "—"}{typeLabel ? `（${profile?.base_model}）` : ""}
        </span>
      </div>

      {/* 2) プロフィール行（名前/IDはアイコン横中央）＋ 設定ボタン */}
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-3">
          <Image src={FALLBACK_USER.avatar} alt="Profile Icon" width={48} height={48}
            className="h-12 w-12 rounded-full border border-white/20 bg-black/20" />
          <div className="flex flex-col justify-center">
            <div className="text-base font-semibold leading-tight">{FALLBACK_USER.name}</div>
            <div className="text-xs text-white/60 leading-tight">ID: {FALLBACK_USER.idNo}</div>
          </div>
        </div>
        <button
          onClick={goSettings}
          className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs hover:bg-white/10"
          title="設定"
        >
          <span>⚙️</span>設定
        </button>
      </div>

      {/* 3) テーマ＆日時（アイコン直下・左端揃え） */}
      <div className="mb-4 text-[11px] text-white/50">
        テーマ: {CURRENT_THEME}<span className="opacity-40 mx-1">•</span>{nowStr}
      </div>

      {/* 4) 直近メッセージカード */}
      <section className="mb-4 rounded-2xl border border-white/12 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-sm font-bold">直近のメッセージ</h2>
          <span className="text-[11px] text-white/50">{fmt(daily?.created_at || profile?.created_at || "")}</span>
        </div>
        <p className="text-sm text-white/90">
          {daily?.comment || profile?.fortune || "まだメッセージはありません。"}
        </p>
      </section>

      {/* 5) 構造ビジュアル（Radar ↔ Line 横スライド / 初期は Radar） */}
      <section className="rounded-2xl border border-white/12 bg-white/5 p-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-bold">
            <span>Radar (</span>
            <span style={{color:PALETTE.E}}>E</span><span className="mx-1"> / </span>
            <span style={{color:PALETTE.V}}>V</span><span className="mx-1"> / </span>
            <span style={{color:PALETTE.L}}>Λ</span><span className="mx-1"> / </span>
            <span style={{color:PALETTE.Eexists}}>Ǝ</span><span>)</span>
          </h2>
          <div className="text-[11px] text-white/60">横スワイプ可</div>
        </div>

        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {/* Slide 1: Radar (default) */}
          <div className="min-w-full snap-center">
            <div className="grid place-items-center h-56 rounded-xl bg-black/25 border border-white/10">
              {today ? <RadarChart values={today}/> : <div className="text-white/60 text-sm">読み込み中…</div>}
            </div>
          </div>

          {/* Slide 2: Line */}
          <div className="min-w-full snap-center">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-sm text-white/80">Line（{range}日推移）</div>
              <div className="flex items-center gap-2 text-xs">
                {[7,30,90].map(n=>(
                  <button key={n}
                    onClick={()=>setRange(n as 7|30|90)}
                    className={`px-3 py-1 rounded border ${range===n?'bg-white/15 border-white/30':'bg-white/5 border-white/10 hover:bg-white/10'}`}>{n}日</button>
                ))}
              </div>
            </div>
            <div className="grid place-items-center rounded-xl bg-black/25 border border-white/10">
              {series ? <TimeSeriesChart data={series}/> : <div className="h-56 grid place-items-center text-white/60 text-sm">読み込み中…</div>}
            </div>
            <div className="mt-2 flex items-center gap-4 text-[11px]">
              {(["E","V","L","Eexists"] as const).map(k=>(
                <div key={k} className="flex items-center gap-1">
                  <span className="inline-block w-3 h-3 rounded" style={{background:(PALETTE as any)[k]}} />
                  <span className="text-white/80" style={{color:(PALETTE as any)[k]}}>{k==="L"?"Λ":k==="Eexists"?"Ǝ":k}</span>
                </div>
              ))}
            </div>
            {chartsErr && <div className="mt-2 text-[11px] text-red-300/80">[{chartsErr}] フォールバック表示中</div>}
          </div>
        </div>
      </section>

      {/* 6) 次の一歩 */}
      <section className="mt-4 rounded-2xl border border-white/12 bg-white/5 p-4">
        <h2 className="text-sm font-bold mb-3">次の一歩を選んでください</h2>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={goDaily} className="rounded-xl border border-white/20 bg-white/10 px-3 py-3 hover:bg-white/15">
            デイリー診断
            <div className="text-[11px] text-white/60 mt-1">1問 / 今日のゆらぎ</div>
          </button>
          <button className="rounded-xl border border-white/10 bg-white/5 px-3 py-3 text-white/50 cursor-not-allowed" title="近日公開">
            診断タイプを選ぶ
            <div className="text-[11px] text-white/40 mt-1">Weekly / Monthly（予定）</div>
          </button>
        </div>
      </section>
    </div>
  )
}
