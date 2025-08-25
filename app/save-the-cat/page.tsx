'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

/**
 * Universal Prompt Builder (Blog-only)
 * - Single-file drop-in for Next.js App Router
 * - Path suggestion: /app/tools/prompt-builder-blog/page.tsx
 * - TailwindCSS required (no external libs)
 * - EVΛƎロジック不使用 / 一般用途
 */
export default function PromptBuilderBlog() {
  // ====== state ======
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [audience, setAudience] = useState('')
  const [searchIntent, setSearchIntent] = useState('')
  const [keywords, setKeywords] = useState('')
  const [platform, setPlatform] = useState('')
  const [tone, setTone] = useState('')
  const [length, setLength] = useState('')
  const [output, setOutput] = useState('')
  const [version] = useState('v1.2-blog')

  const promoHref = 'https://salmon385780.studio.site' // ← 本番URLが決まったら差し替え

  // ====== autosave (localStorage) ======
  useEffect(() => {
    const saved = localStorage.getItem('upb-blog')
    if (saved) {
      try {
        const s = JSON.parse(saved)
        setTitle(s.title || '')
        setGenre(s.genre || '')
        setAudience(s.audience || '')
        setSearchIntent(s.searchIntent || '')
        setKeywords(s.keywords || '')
        setPlatform(s.platform || '')
        setTone(s.tone || '')
        setLength(s.length || '')
        setOutput(s.output || '')
      } catch {}
    }
  }, [])

  useEffect(() => {
    const toSave = {
      title,
      genre,
      audience,
      searchIntent,
      keywords,
      platform,
      tone,
      length,
      output,
    }
    localStorage.setItem('upb-blog', JSON.stringify(toSave))
  }, [title, genre, audience, searchIntent, keywords, platform, tone, length, output])

  // ====== helpers ======
  const charCount = useMemo(() => output.length, [output])

  const handleGenerate = () => {
    const baseTitle = title.trim()
    const p = `\nあなたはSEOに配慮する編集者AIです。以下の条件で「構成案（見出し）」と「本文ドラフト」を作成してください。\n\n# 記事タイトル\n「${baseTitle}」\n\n# カテゴリ\n${genre || '（未指定）'}\n\n# 想定読者\n${audience || '初心者'}\n\n# 検索意図\n${searchIntent || 'このテーマの基本と実践を短時間で知りたい'}\n\n# 主要キーワード\n${keywords || '（必要に応じて選定）'}\n\n# プラットフォーム\n${platform || '自社ブログ'}\n\n# 書き方・制約\n- トーン：${tone || '明快で具体的'}\n- 分量：${length || '見出し5つ＋本文計1500〜2500字'}\n- 出力：\n  1) 要約（120〜160字）\n  2) 見出し構成（H2/H3）\n  3) 本文ドラフト（各見出し300〜500字）\n  4) FAQ 3件\n  5) CTA（次の行動を1つ）\n- 日本語で出力\n`.trim()
    setOutput(p)
    queueMicrotask(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' })
    })
  }

  const handleCopy = async () => {
    if (!output) return alert('先にプロンプトを生成してください')
    try {
      await navigator.clipboard.writeText(output)
      alert('コピーしました！')
    } catch (e) {
      alert('コピーに失敗：手動で選択してコピーしてください')
    }
  }

  const handleDownload = () => {
    if (!output) return alert('先にプロンプトを生成してください')
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || 'blog'}_prompt.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleReset = () => {
    setTitle('')
    setGenre('')
    setAudience('')
    setSearchIntent('')
    setKeywords('')
    setPlatform('')
    setTone('')
    setLength('')
    setOutput('')
  }

  const preset = (kind: 'note' | 'corp' | 'medium') => {
    if (kind === 'note') {
      setPlatform('Note')
      setTone('親しみやすく、具体例多め')
      setLength('見出し5つ＋本文計1500〜2000字')
      setAudience('学びたい個人クリエイター')
    }
    if (kind === 'corp') {
      setPlatform('自社ブログ / LP')
      setTone('明快で実務的（敬体）')
      setLength('見出し6つ＋本文計2000〜3000字')
      setAudience('意思決定者 / マーケ担当')
    }
    if (kind === 'medium') {
      setPlatform('Medium')
      setTone('簡潔かつ洞察的（常体）')
      setLength('見出し4つ＋本文計1200〜1800字')
      setAudience('海外テック読者')
    }
  }

  return (
    <div className="bg-black text-white min-h-dvh">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 grid gap-6">
        {/* header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Universal Prompt Builder <span className="text-white/60">β</span>
            </h1>
            <p className="text-white/60 text-sm">AIは使いません。入力→テンプレ整形→コピー／保存だけ。</p>
          </div>
          <span className="text-xs text-white/50">{version}</span>
        </header>

        {/* 基本情報 */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg md:text-xl font-semibold">ブログ記事に特化</h2>
            <div className="flex gap-2">
              <button onClick={() => preset('note')} className="px-3 py-1.5 rounded-xl text-xs bg-white/10 hover:bg-white/15">Note向け</button>
              <button onClick={() => preset('corp')} className="px-3 py-1.5 rounded-xl text-xs bg-white/10 hover:bg-white/15">自社ブログ向け</button>
              <button onClick={() => preset('medium')} className="px-3 py-1.5 rounded-xl text-xs bg-white/10 hover:bg-white/15">Medium向け</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-white/90">記事タイトル</label>
              <input value={title} onChange={e=>setTitle(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：AIに神と呼ばれた男のSEOで学んだこと" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/90">カテゴリ</label>
              <input value={genre} onChange={e=>setGenre(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：SEO／プロンプト／開発ログ" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-white/90">想定読者</label>
              <input value={audience} onChange={e=>setAudience(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：20–30代のクリエイター" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/90">トーン</label>
              <input value={tone} onChange={e=>setTone(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：明快で具体的／親しみやすく" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/90">分量</label>
              <input value={length} onChange={e=>setLength(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：見出し5つ＋本文計1500〜2500字" />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-white/90">検索意図</label>
              <input value={searchIntent} onChange={e=>setSearchIntent(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：最短で“使える”プロンプトが知りたい" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/90">主要キーワード（,区切り）</label>
              <input value={keywords} onChange={e=>setKeywords(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：SEO, プロンプト, 初心者" />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-sm font-medium text-white/90">掲載媒体 / プラットフォーム</label>
            <input value={platform} onChange={e=>setPlatform(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：Note / 自社ブログ / Medium" />
          </div>
        </section>

        {/* actions */}
        <div className="grid md:grid-cols-4 gap-3">
          <button onClick={handleGenerate} className="rounded-2xl px-4 py-3 font-semibold bg-white text-black hover:opacity-90">プロンプト生成</button>
          <button onClick={handleCopy} className="rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/15">コピー</button>
          <button onClick={handleDownload} className="rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/15">.txtで保存</button>
          <button onClick={handleReset} className="rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/15">リセット</button>
        </div>

        {/* output */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-semibold">生成されたプロンプト</h2>
            <span className="text-xs text-white/50">{charCount} chars</span>
          </div>
          <textarea value={output} onChange={e=>setOutput(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40 min-h-[220px] font-mono text-sm" placeholder="ここに生成結果が表示されます" />
          <p className="text-xs text-white/50 mt-2">※ このままAIに貼り付けて使えます（本ツール自体はAIを呼びません）。</p>
        </section>

        {/* promo */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base md:text-lg font-semibold">さらに深い体験へ：ソウルレイヤー診断</h3>
              <p className="text-white/70 text-sm">意識の現在地を可視化する診断アプリ。毎日のゆらぎから自分のパターンを観測。</p>
            </div>
            <a href={promoHref} target="_blank" className="rounded-2xl px-4 py-3 font-semibold bg-white text-black hover:opacity-90">ソウルレイヤー診断へ</a>
          </div>
        </section>

        <footer className="text-center text-white/40 text-xs pt-2">
          © Universal Prompt Builder — Blog Edition (EVΛƎロジック不使用)
        </footer>
      </div>
    </div>
  )
}
