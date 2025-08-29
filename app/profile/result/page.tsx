import { Suspense } from 'react'
import ResultClient from './ResultClient'

// 実行時描画（SSGしない）
export const dynamic = 'force-dynamic'
export const revalidate = 0

export default function Page() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-75">読み込み中…</div>}>
      <ResultClient />
    </Suspense>
  )
}



type Result = {
  id: string
  name: string
  birthday: string
  blood: string
  gender: string
  preference: string
  fortune: string
  personality: string
  ideal_partner: string
  created_at: string
}

function ResultBody() {
  const sp = useSearchParams()
  const id = sp.get('id')
  const [r, setR] = useState<Result | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const run = async () => {
      try {
        if (!id) throw new Error('リンクが無効です')
        const res = await fetch(`/api/profile/get?id=${encodeURIComponent(id)}`, { cache: 'no-store' })
        const j = await res.json()
        if (!j.ok) throw new Error(j.error || 'failed')
        setR(j.data as Result)
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e))
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [id])

  if (loading) return <div className="p-6 text-sm opacity-75">読み込み中…</div>
  if (err) return <div className="p-6 text-sm text-red-400">エラー：{err}</div>
  if (!r) return null

  return (
    <div className="mx-auto max-w-2xl p-4 grid gap-4">
      <header className="flex items-center justify-between">
        <h1 className="text-lg font-bold">プロフィール診断結果</h1>
        <a href="/profile" className="text-xs underline opacity-90">編集</a>
      </header>

      <section className="grid md:grid-cols-3 gap-3">
        <article className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold mb-2 text-sm">総合運勢</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.fortune}</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold mb-2 text-sm">性格傾向</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.personality}</p>
        </article>
        <article className="rounded-xl border border-white/10 bg-white/5 p-4">
          <h2 className="font-semibold mb-2 text-sm">理想のパートナー像</h2>
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{r.ideal_partner}</p>
        </article>
      </section>

      <footer className="text-xs opacity-70">
        保存日時：{new Date(r.created_at).toLocaleString('ja-JP')}
      </footer>
    </div>
  )
}

export default function ProfileResultPage() {
  return (
    <Suspense fallback={<div className="p-6 text-sm opacity-75">読み込み中…</div>}>
      <ResultBody />
    </Suspense>
  )
}
