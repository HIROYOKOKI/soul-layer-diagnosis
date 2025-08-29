// /app/dev/colors/page.tsx
'use client'

type Swatch = { name: string; className: string; note?: string }

const brand: Swatch[] = [
  { name: 'brand', className: 'bg-brand' },
  { name: 'brand-600 (hover)', className: 'bg-brand-600' },
  { name: 'brand-700 (active)', className: 'bg-brand-700' },
  { name: 'ring (=brand)', className: 'bg-ring' },
]

const surface: Swatch[] = [
  { name: 'bg (app)', className: 'bg-bg' },
  { name: 'surface (card/header)', className: 'bg-surface' },
  { name: 'surface-2 (hover/selected)', className: 'bg-surface-2' },
  { name: 'border', className: 'bg-border' },
]

const text: Swatch[] = [
  { name: 'fg (text)', className: 'bg-fg text-bg', note: '※見やすいよう反転' },
  { name: 'muted', className: 'bg-muted text-bg', note: '※見やすいよう反転' },
  { name: 'on-brand', className: 'bg-on-brand text-bg', note: '※見やすいよう反転' },
]

const feedback: Swatch[] = [
  { name: 'success', className: 'bg-success' },
  { name: 'warning', className: 'bg-warning text-bg' },
  { name: 'danger', className: 'bg-danger' },
]

function Grid({ title, items }: { title: string; items: Swatch[] }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold text-fg/90">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {items.map((s) => (
          <div
            key={s.name}
            className={`aspect-video rounded-[var(--radius-card)] border border-border shadow-[var(--shadow-card)] flex items-end p-3 ${s.className}`}
          >
            <div className="bg-black/30 backdrop-blur-sm rounded px-2 py-1 text-sm text-on-brand">
              {s.name}
              {s.note ? <span className="text-on-brand/70"> — {s.note}</span> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export default function ColorPreview() {
  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="sticky top-0 z-10 bg-surface/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold">EVΛƎ UI Color Preview</h1>
          <div className="flex gap-2">
            <button className="rounded-[var(--radius-pill)] px-4 py-2 bg-brand text-on-brand hover:bg-brand-600 active:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-ring/60">
              Primary
            </button>
            <button className="rounded-[var(--radius-pill)] px-4 py-2 bg-transparent border border-border text-fg hover:bg-surface-2 focus:outline-none focus:ring-2 focus:ring-ring/40">
              Ghost
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-10">
        <p className="text-muted">
          下のスウォッチは Tailwind v4 の <code>@theme</code> 変数に基づくクラス
          （例：<code>bg-brand</code> / <code>bg-surface</code> / <code>text-fg</code>）
          の見た目を一覧表示します。
        </p>

        <Grid title="Brand" items={brand} />
        <Grid title="Surface" items={surface} />
        <Grid title="Text" items={text} />
        <Grid title="Feedback" items={feedback} />

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-fg/90">実戦プレビュー（カード＋選択状態）</h2>
          <ul className="grid sm:grid-cols-2 gap-4">
            {['仕事', '恋愛・結婚', '未来・進路', '自己理解・性格'].map((label, i) => {
              const active = i === 1 // 2番目を選択中に見せる例
              return (
                <li
                  key={label}
                  aria-selected={active}
                  className={`relative bg-surface border border-border rounded-[var(--radius-card)] p-4 transition
                    ${active ? 'ring-1 ring-ring/60 bg-surface-2' : 'hover:bg-surface-2'}`}
                >
                  <span
                    className={`absolute left-0 top-0 h-full w-[3px] rounded-l-[var(--radius-card)]
                    ${active ? 'bg-brand' : 'bg-transparent'}`}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={`size-2 rounded-full ${active ? 'bg-brand' : 'bg-border'}`} />
                      <span className={active ? 'text-fg' : 'text-muted'}>{label}</span>
                    </div>
                    <button className="rounded-[var(--radius-pill)] px-3 py-1.5 text-sm bg-brand text-on-brand hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-ring/60">
                      選択
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        </section>
      </main>
    </div>
  )
}
