'use client'

import { useState } from 'react'

/**
 * Save the Cat対応 Universal Prompt Builder β（物語／ブログ特化）
 * - 単一ページで設置可能（/app/save-the-cat/page.tsx 推奨）
 * - Tailwind CSS 前提
 * - このページ自体はAIを呼びません。入力→テンプレ整形→コピー/保存のみ
 */
export default function SaveTheCatPromptBuilder() {
  type Mode = 'novel' | 'blog'
  const [mode, setMode] = useState<Mode>('novel')
  const [ver] = useState('1.2 (STC)')

  // 共通フィールド
  const [title, setTitle] = useState('')
  const [genre, setGenre] = useState('')
  const [theme, setTheme] = useState('')
  const [audience, setAudience] = useState('')
  const [tone, setTone] = useState('')
  const [length, setLength] = useState('')

  // 小説（STC用）
  const [setting, setSetting] = useState('')
  const [hero, setHero] = useState('')
  const [flaw, setFlaw] = useState('')
  const [start, setStart] = useState('')
  const [characters, setCharacters] = useState('')

  // ブログ
  const [keywords, setKeywords] = useState('')
  const [platform, setPlatform] = useState('')
  const [searchIntent, setSearchIntent] = useState('')

  // 出力
  const [output, setOutput] = useState('')

  const Field = ({
    label,
    children
  }: {
    label: string
    children: React.ReactNode
  }) => (
    <div>
      <label className="text-sm font-medium text-white/90 block mb-1">{label}</label>
      {children}
    </div>
  )

  const Input = (props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
      {...props}
      className={`w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40 ${props.className || ''}`}
    />
  )

  const Textarea = (props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
      {...props}
      className={`w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40 min-h-[88px] ${props.className || ''}`}
    />
  )

  function resetAll() {
    setTitle(''); setGenre(''); setTheme(''); setAudience(''); setTone(''); setLength('')
    setSetting(''); setHero(''); setFlaw(''); setStart(''); setCharacters('')
    setKeywords(''); setPlatform(''); setSearchIntent('')
    setOutput('')
  }

  function buildNovelPrompt() {
    const baseReader = audience || '一般読者'
    const baseTone = tone || 'やさしく、読みやすく'
    const baseLen = length || '短編（1200〜2000字）'

    // Save the Cat 15ビートの骨子を明示したプロンプト
    const p = `
あなたはSave the Cat!のビートシートを用いる編集者AIです。以下の条件で「短編プロット」と「本文」を生成してください。EVΛƎコード等の特殊理論は使わず、一般的なナラティブで構いません。

# 作品タイトル
「${title}」

# ジャンル
${genre}

# テーマ（Theme Stated）
${theme}

# 舞台設定
${setting}

# 主人公
${hero}
短所・葛藤：${flaw}
開始状況：${start}

# 重要人物（1行=1人）
${characters || '（該当なしの場合は主人公の内面を掘り下げる）'}

# 書き方・制約
- 想定読者：${baseReader}
- トーン：${baseTone}
- 分量：${baseLen}
- 日本語で出力

# 構成（Save the Cat 15ビートで明示）
1) Opening Image（主人公の日常のスナップ）
2) Theme Stated（誰かの一言で物語の主題が示唆される）
3) Set-up（主要キャラ・日常・欠落の提示）
4) Catalyst（転機/出来事）
5) Debate（進むべきか葛藤）
6) Break into Two（第二幕へ。能動的選択）
7) B Story（対話/関係性のサブライン）
8) Fun and Games（企てと試行。ジャンルの楽しさ）
9) Midpoint（偽りの勝利/敗北 or 真の啓示）
10) Bad Guys Close In（内外からの圧力の高まり）
11) All Is Lost（どん底/象徴的喪失）
12) Dark Night of the Soul（内省。主題への気づき）
13) Break into Three（解決のアイデアを得る）
14) Finale（計画→実行→変化の証明）
15) Final Image（Opening Imageとの対比で変化を可視化）

# 出力
- まず「起承転結要約（各2〜3文）」を提示
- 続いて「15ビートの要点」を各2〜3文で列挙
- 最後に「本文（情景描写＋台詞、多層の感情を残す）」
    `.trim()
    return p
  }

  function buildBlogPrompt() {
    const baseReader = audience || '初心者〜中級者'
    const baseTone = tone || '明快で具体的'
    const baseLen = length || '見出し5つ＋本文計1500〜2500字'

    // ブログ版はSTCの骨子を「読者の旅路」に転用
    const p = `
あなたはSEOとストーリーテリングに長けた編集者AIです。以下の条件で「構成案（見出し）」と「本文ドラフト」を作成してください。Save the Catの15ビートを読者の学習ジャーニーに転用し、流れを生みます。

# 記事タイトル
「${title}」

# カテゴリ
${genre}

# 想定読者
${baseReader}

# 検索意図（課題/期待）
${searchIntent || '最短で使える知識と手順を把握したい'}

# 主要キーワード
${keywords || '（必要に応じて選定）'}

# プラットフォーム
${platform || '自社ブログ/Note'}

# 書き方・制約
- トーン：${baseTone}
- 分量：${baseLen}
- 出力：
  1) 要約（120〜160字）
  2) 見出し構成（H2/H3）
  3) 本文ドラフト（各見出し300〜500字）
  4) 事例/失敗談（2つ）
  5) FAQ 3件（検索意図を補完）
  6) CTA（1つ）
- 日本語で出力

# ストーリー骨子（ブログ向けSTC適用例）
1) Opening Image：現状のつまずき
2) Theme Stated：この記事の主旨（読者の望む成果）
3) Set-up：前提/必要条件（環境設定）
4) Catalyst：核心Tips or 重要定義
5) Debate：よくある誤解/選択肢の比較
6) Break into Two：採用する戦略の宣言
7) B Story：ケース/体験談で腹落ち
8) Fun and Games：手順や型の実践パート
9) Midpoint：中間レビュー（ミニ成果）
10) Bad Guys Close In：落とし穴/対処
11) All Is Lost：典型的失敗例
12) Dark Night of the Soul：転換の洞察
13) Break into Three：改善プラン提示
14) Finale：実装チェックリスト
15) Final Image：ビフォー/アフターの比較
    `.trim()
    return p
  }

  function generate() {
    const baseEmpty = !title && !genre && !theme && !audience && !tone && !length
    if (baseEmpty && mode === 'novel' && !setting && !hero && !flaw && !start) {
      alert('最小限：タイトル/ジャンル/テーマ/主人公 などを入力してください。')
      return
    }
    if (mode === 'novel') setOutput(buildNovelPrompt())
    if (mode === 'blog') setOutput(buildBlogPrompt())
    setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 0)
  }

  async function copyOut() {
    if (!output) return alert('先にプロンプトを生成してください')
    try { await navigator.clipboard.writeText(output); alert('コピーしました！') }
    catch { alert('コピーに失敗：手動で選択してコピーしてください') }
  }

  function downloadTxt() {
    if (!output) return alert('先にプロンプトを生成してください')
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title || (mode === 'novel' ? 'novel' : 'blog')}_prompt_stc.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 grid gap-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Universal Prompt Builder <span className="text-white/60">β</span>
            </h1>
            <p className="text-white/60 text-sm">Save the Cat対応版。AIは使いません。入力→テンプレ整形→コピー/保存だけ。</p>
          </div>
          <span className="text-xs text-white/50">v{ver}</span>
        </header>

        {/* Mode Switch */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-4">モードを選択</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setMode('novel')}
              className={`px-3 py-2 rounded-xl text-sm border ${mode==='novel' ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
            >小説（Save the Cat）</button>
            <button
              onClick={() => setMode('blog')}
              className={`px-3 py-2 rounded-xl text-sm border ${mode==='blog' ? 'bg-white text-black border-white' : 'bg-white/5 hover:bg-white/10 border-white/10'}`}
            >ブログ（STCで読ませる）</button>
          </div>
        </section>

        {/* 基本情報 */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-4">基本情報</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <Field label="タイトル / 名称">
              <Input value={title} onChange={e=>setTitle(e.target.value)} placeholder="例：十年後の私" />
            </Field>
            <Field label="ジャンル / カテゴリ">
              <Input value={genre} onChange={e=>setGenre(e.target.value)} placeholder="例：現代ドラマ／ビジネス" />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="テーマ / 伝えたい一言">
              <Input value={theme} onChange={e=>setTheme(e.target.value)} placeholder="例：観測が意味を生み、選択が未来を形づくる" />
            </Field>
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <Field label="想定読者 / ターゲット">
              <Input value={audience} onChange={e=>setAudience(e.target.value)} placeholder="例：20–30代のクリエイター" />
            </Field>
            <Field label="トーン / 文体">
              <Input value={tone} onChange={e=>setTone(e.target.value)} placeholder="例：やさしく、少し哲学的／明快で実務的" />
            </Field>
            <Field label="分量 / スコープ">
              <Input value={length} onChange={e=>setLength(e.target.value)} placeholder="例：短編1200–2000字／見出し5つ" />
            </Field>
          </div>
        </section>

        {/* Novel */}
        {mode === 'novel' && (
          <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
            <h3 className="text-base md:text-lg font-semibold mb-3">小説：Save the Cat 追加情報</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="舞台設定">
                <Textarea value={setting} onChange={e=>setSetting(e.target.value)} placeholder="例：現代の日本、雨の多い春。小さな喫茶店とアトリエ。" />
              </Field>
              <Field label="主人公（名前／立場）">
                <Textarea value={hero} onChange={e=>setHero(e.target.value)} placeholder="例：ミナ／29歳・イラストレーター志望（事務の非常勤）" />
              </Field>
            </div>
            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <Field label="短所・葛藤">
                <Textarea value={flaw} onChange={e=>setFlaw(e.target.value)} placeholder="例：決断を先延ばしにしがち。過去の選択に後悔。" />
              </Field>
              <Field label="開始状況（冒頭）">
                <Textarea value={start} onChange={e=>setStart(e.target.value)} placeholder="例：日常は安定だが空虚。SNSに絵を出す勇気が出ない。" />
              </Field>
            </div>
            <div className="mt-4">
              <Field label="重要人物（1行=1人）">
                <Textarea value={characters} onChange={e=>setCharacters(e.target.value)} placeholder={"ノア：観測の相棒\\n親友：実務的で支えてくれる"} />
              </Field>
            </div>
            <details className="mt-4 text-sm text-white/70">
              <summary className="cursor-pointer">STC 15ビートのチェックリスト（参考）</summary>
              <ul className="list-disc pl-5 mt-2 space-y-1 text-white/70">
                <li>Opening Image / Final Image が対比になっているか</li>
                <li>Theme Stated が主人公の変化と結びつくか</li>
                <li>Catalyst → Debate → Break into
