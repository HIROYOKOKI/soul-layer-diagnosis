'use client'
import React from 'react'

type EVKey = 'E' | 'V' | 'L' | 'Eexists'
type EVVals = { E: number; V: number; L: number; Eexists: number }
export type EVColors = { E: string; V: string; L: string; Eexists: string }

const DEFAULT_COLORS: EVColors = {
  E: '#FF4500',
  V: '#1E3A8A',
  L: '#84CC16',
  Eexists: '#7E22CE'
}

const DEFAULT_ORDER = ['E','V','L','Eexists'] as const

function labelOf(k: EVKey) { return k === 'L' ? 'Λ' : k === 'Eexists' ? 'Ǝ' : k }
function clamp01(n: unknown) { const v = typeof n==='number'?n:Number(n); return Number.isFinite(v)? Math.max(0,Math.min(1,v)) : 0 }
function hexToRGBA(hex: string, a: number) {
  const h = hex.replace('#','');
  const n = parseInt(h.length===3 ? h.split('').map(c=>c+c).join('') : h, 16);
  const r = (n>>16)&255, g=(n>>8)&255, b=n&255;
  return `rgba(${r},${g},${b},${a})`;
}

export function EVAEColorBadges({
  values,
  colors = DEFAULT_COLORS,
  size = 24,
  box = 40,
  rounded = 10,
  gap = 12,
  highlightMax = true,
  showScore = false,
}: {
  values?: Partial<EVVals>
  colors?: EVColors
  size?: number
  box?: number
  rounded?: number
  gap?: number
  highlightMax?: boolean
  showScore?: boolean
}) {
  const v: EVVals = {
    E: clamp01(values?.E ?? 0),
    V: clamp01(values?.V ?? 0),
    L: clamp01(values?.L ?? 0),
    Eexists: clamp01(values?.Eexists ?? 0),
  }
  const entries = Object.entries(v) as Array<[EVKey, number]>
  const maxKey = entries.sort((a,b)=>b[1]-a[1])[0]?.[0] ?? 'E'
  return (
    <div className="flex items-end" style={{ gap }}>
      {(['E','V','L','Eexists'] as const).map((k)=>{
        const isMax = highlightMax && k===maxKey
        const color = colors[k]
        return (
          <div key={k} className="relative flex flex-col items-center">
            <div
              className="relative grid place-items-center"
              style={{
                width: box, height: box,
                borderRadius: rounded,
                background: `radial-gradient(circle at center, ${color} 0%, ${color}AA 60%, ${color}55 100%)`,
                boxShadow: `${isMax ? `0 0 22px ${color}99, inset 0 0 18px ${color}66` : `inset 0 0 12px ${color}40`}`,
                border: isMax ? `1px solid ${color}AA` : `1px solid ${color}66`,
              }}
              title={`${labelOf(k)}: ${v[k].toFixed(2)}`}
            >
              <span className="font-extrabold" style={{ color: '#fff', fontSize: size }}>{labelOf(k)}</span>
            </div>
            {showScore && (
              <div className="mt-1 text-[12px] text-white/80">{v[k].toFixed(2)}</div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export function EVAEChartSquares({
  colors = DEFAULT_COLORS,
  order,
  size = 12,
  gap = 14,
  radius = 3,
  glow = true,
  showLabels = true,
}: {
  colors?: EVColors
  order?: Readonly<EVKey[]>
  size?: number
  gap?: number
  radius?: number
  glow?: boolean
  showLabels?: boolean
}) {
  const ord = (order ?? DEFAULT_ORDER) as readonly EVKey[]
  return (
    <div className="flex items-center" style={{ gap }}>
      {ord.map((k: EVKey)=> (
        <div key={k} className="flex items-center gap-1">
          <span
            aria-label={labelOf(k)}
            className="inline-block"
            style={{
              width: size,
              height: size,
              borderRadius: radius,
              background: colors[k],
              boxShadow: glow? `0 0 10px ${colors[k]}66` : undefined,
              border: `1px solid ${colors[k]}55`,
            }}
          />
          {showLabels && (
            <span className="text-[12px] text-white/80">{labelOf(k)}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export function EVAEPolarChart({ values, colors = DEFAULT_COLORS, size = 280, gridSteps = 4, fillAlpha = 0.28, showVertices = true }: { values: EVVals, colors?: EVColors, size?: number, gridSteps?: number, fillAlpha?: number, showVertices?: boolean }) {
  const half = size/2
  const keys: EVKey[] = ['E','V','L','Eexists']
  const angles = [ -90, 0, 90, 180 ].map(a=> a*Math.PI/180)
  const r = (t:number)=> t*half*0.9
  const pts = keys.map((k,i)=> { const v = Math.max(0, Math.min(1, (values as any)[k] as number)); return [ half + Math.cos(angles[i]) * r(v), half + Math.sin(angles[i]) * r(v) ] as const })
  const toStr = ([x,y]: readonly number[])=> `${x},${y}`
  const gridCircles = Array.from({length: gridSteps}, (_,i)=> r((i+1)/gridSteps))

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <rect x={0} y={0} width={size} height={size} fill="transparent" />
      {gridCircles.map((rr,idx)=> (
        <circle key={idx} cx={half} cy={half} r={rr} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth={1} />
      ))}
      <line x1={half} y1={half} x2={half} y2={half - r(1)} stroke={colors.E} strokeWidth={1.5} />
      <line x1={half} y1={half} x2={half + r(1)} y2={half} stroke={colors.V} strokeWidth={1.5} />
      <line x1={half} y1={half} x2={half} y2={half + r(1)} stroke={colors.L} strokeWidth={1.5} />
      <line x1={half} y1={half} x2={half - r(1)} y2={half} stroke={colors.Eexists} strokeWidth={1.5} />
      <polygon points={pts.map(toStr).join(' ')} fill={hexToRGBA(colors.Eexists, fillAlpha)} stroke="none" />
      {showVertices && pts.map((p,i)=>{ const k = keys[i]; return <circle key={`v-${i}`} cx={p[0]} cy={p[1]} r={4} fill={(colors as any)[k]} stroke="rgba(0,0,0,0.4)" strokeWidth={1} /> })}
      <text x={half} y={half - r(1) - 10} textAnchor="middle" fill={colors.E} fontSize={14} fontWeight={700}>E</text>
      <text x={half + r(1) + 10} y={half + 4} textAnchor="start" fill={colors.V} fontSize={14} fontWeight={700}>V</text>
      <text x={half} y={half + r(1) + 18} textAnchor="middle" fill={colors.L} fontSize={14} fontWeight={700}>Λ</text>
      <text x={half - r(1) - 10} y={half + 4} textAnchor="end" fill={colors.Eexists} fontSize={14} fontWeight={700}>Ǝ</text>
    </svg>
  )
}

export function EVAETrendChart({ days = 90, windowSize = 30, colors = DEFAULT_COLORS }: { days?: number, windowSize?: 7 | 30 | 90, colors?: EVColors }) {
  const pad = 24
  const w = 720
  const h = 260
  const innerW = w - pad*2
  const innerH = h - pad*2
  const mk = (seed:number)=> (i:number)=> {
    const t = (i+seed)/6
    const base = (Math.sin(t)+1)/2
    const wobble = (Math.sin(t*0.7+seed)+1)/4
    const noise = (Math.sin(i*1.37+seed*2)+1)/10
    return Math.max(0, Math.min(1, base*0.6 + wobble*0.3 + noise*0.2))
  }
  const gen = (n:number)=> Array.from({length:n},(_,i)=>({ i, E: mk(1)(i), V: mk(3)(i), L: mk(5)(i), Eexists: mk(7)(i) }))
  const full = React.useMemo(()=> gen(days),[days])
  const [range,setRange] = React.useState<7|30|90>(windowSize)
  const [start,setStart] = React.useState(0)
  const maxStart = Math.max(0, full.length - range)
  React.useEffect(()=>{ if (start>maxStart) setStart(maxStart) },[range, maxStart])
  const view = full.slice(start, start+range)
  const x = (idx:number)=> pad + (idx/(range-1))*innerW
  const y = (v:number)=> pad + (1-v)*innerH
  const line = (key:EVKey)=> view.map((d,idx)=> `${idx===0?'M':'L'} ${x(idx)} ${y(d[key])}`).join(' ')
  const ticksY = [0,0.5,1]

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center gap-2 text-sm mb-2">
        {[7,30,90].map((n)=> (
          <button key={n} onClick={()=>setRange(n as 7|30|90)}
            className={`px-3 py-1 rounded border ${range===n? 'bg-white/15 border-white/30':'bg-white/5 border-white/10 hover:bg-white/10'}`}>{n}日</button>
        ))}
        <div className="ml-4 flex items-center gap-2 text-xs text-white/70">
          <span>スライド:</span>
          <input type="range" min={0} max={maxStart} step={1} value={start} onChange={(e)=> setStart(Number(e.target.value))} />
        </div>
      </div>
      <svg width={w} height={h} className="block">
        <rect x={0} y={0} width={w} height={h} rx={12} fill="#0b0b0f" />
        <rect x={pad} y={pad} width={innerW} height={innerH} fill="none" stroke="rgba(255,255,255,0.15)" />
        {ticksY.map((ty)=> (
          <g key={ty}>
            <line x1={pad} y1={y(ty)} x2={pad+innerW} y2={y(ty)} stroke="rgba(255,255,255,0.1)" />
            <text x={pad-6} y={y(ty)+4} textAnchor="end" fill="rgba(255,255,255,0.6)" fontSize={10}>{ty.toFixed(1)}</text>
          </g>
        ))}
        {(['E','V','L','Eexists'] as const).map((k)=> (
          <path key={k} d={line(k)} fill="none" stroke={(colors as any)[k]} strokeWidth={2} />
        ))}
        {view.map((d,idx)=> (
          <g key={idx}>
            <line x1={x(idx)} y1={pad} x2={x(idx)} y2={pad+innerH} stroke="rgba(255,255,255,0.04)" />
          </g>
        ))}
        {(['E','V','L','Eexists'] as const).map((k)=> view.map((d,idx)=> (
          <circle key={`${k}-${idx}`} cx={x(idx)} cy={y(d[k])} r={2.5} fill={(colors as any)[k]} />
        )))}
      </svg>
      <div className="mt-2">
        <EVAEChartSquares showLabels colors={colors} />
      </div>
    </div>
  )
}

export default function EVAEColorBadgesDemo() {
  const [vals,setVals] = React.useState<EVVals>({ E: 0.62, V: 0.78, L: 0.45, Eexists: 0.68 })

  return (
    <div className="p-6 bg-black text-white space-y-8">
      <div className="space-y-3">
        <EVAEColorBadges values={vals} size={28} box={44} rounded={12} gap={14} highlightMax showScore />
      </div>
      <div className="flex flex-col items-center">
        <EVAEPolarChart values={vals} />
      </div>
      <div className="flex flex-wrap gap-3 text-xs text-white/70">
        {(['E','V','L','Eexists'] as const).map((k)=> (
          <label key={k} className="flex items-center gap-2">
            <span style={{ color: DEFAULT_COLORS[k] }} className="w-10">{labelOf(k)}</span>
            <input type="range" min={0} max={1} step={0.01} value={(vals as any)[k]}
              onChange={(e)=> setVals(v=>({ ...v, [k]: Number(e.target.value) }))} />
            <span className="w-10 text-right">{(vals as any)[k].toFixed(2)}</span>
          </label>
        ))}
      </div>
      <div className="space-y-2">
        <h3 className="text-sm text-white/70">時系列（ダミー）</h3>
        <EVAETrendChart />
      </div>
      <div>
        <EVAEChartSquares />
      </div>
    </div>
  )
}

if (typeof window !== 'undefined') {
  console.assert(labelOf('L')==='Λ' && labelOf('Eexists')==='Ǝ', 'labelOf mapping OK')
  const v: EVVals = { E: 0.2, V: 0.8, L: 0.4, Eexists: 0.6 }
  const maxKey = (Object.entries(v) as Array<[EVKey, number]>).sort((a,b)=>b[1]-a[1])[0][0]
  console.assert(maxKey==='V', 'max detection OK')
  console.assert(typeof EVAEChartSquares === 'function', 'EVAEChartSquares defined')
  console.assert(typeof EVAEPolarChart === 'function', 'EVAEPolarChart defined')
  console.assert(hexToRGBA('#ff0000',0.5)==='rgba(255,0,0,0.5)', 'hexToRGBA red')
}
