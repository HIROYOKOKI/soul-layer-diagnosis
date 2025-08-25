"use client";

import { useState, useMemo } from "react";

/**
 * Universal Prompt Builder — Blog専用（単独ページ）
 * ルート: /prompt-builder-blog
 * 依存: Tailwind CSS（プロジェクトのglobals.css経由）
 * 外部ライブラリ不要。コピー/保存/リセットまで完結。
 */
export default function PromptBuilderBlog() {
  // ====== 状態管理 ======
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [theme, setTheme] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [length, setLength] = useState("");
  const [keywords, setKeywords] = useState("");
  const [platform, setPlatform] = useState("");
  const [searchIntent, setSearchIntent] = useState("");
  const [outlineCount, setOutlineCount] = useState<number>(5);
  const [includeFAQ, setIncludeFAQ] = useState<boolean>(true);
  const [includeCTA, setIncludeCTA] = useState<boolean>(true);
  const [ctaText, setCtaText] = useState("ソウルレイヤー診断（無料）を試す");
  const [promoHref, setPromoHref] = useState("/daily"); // 必要に応じて差し替え
  const [output, setOutput] = useState("");

  // ====== 生成ロジック ======
  const generated = useMemo(() => {
    // ガード（タイトルが空なら生成しない）
    if (!title.trim()) return "";

    const oc = Math.max(3, Math.min(10, outlineCount || 5));

    const header = `あなたはSEOと読者体験に強い編集者AIです。以下の条件で「構成案（見出し）」と「本文ドラフト」を日本語で作成してください。`;

    const body = `\n\n# 記事タイトル\n「${title.trim()}」\n\n# カテゴリ\n${genre.trim() || "（未指定：適宜設定）"}\n\n# 想定読者\n${audience.trim() || "初心者"}\n\n# 検索意図\n${searchIntent.trim() || "短時間で“使える”実践ポイントが知りたい"}\n\n# 主要キーワード（,区切り）\n${keywords.trim() || "（必要に応じて選定）"}\n\n# 掲載プラットフォーム\n${platform.trim() || "自社ブログ"}\n\n# トーン\n${tone.trim() || "明快で具体的。専門用語は短く補足"}\n\n# 分量ガイド\n${length.trim() || `見出し${oc}つ＋本文合計1500〜2500字`}\n\n# 書き方・制約\n- まず120〜160字の要約（メタディスクリプション想定）。\n- H2を${oc}個、必要に応じてH3を追加。\n- 各H2配下に300〜500字の本文ドラフト。\n- 重要箇所は**太字**で強調語を1つまで。\n- テンポの良い短文と箇条書きを織り交ぜて可読性を高める。\n- 事例/手順/チェックリストを最小1つ入れる。\n${includeFAQ ? "- 最後にFAQを3件。\n" : ""}${includeCTA ? "- 最後に明確なCTAを1つ（例：『" + ctaText + "』）。\n" : ""}- 可能ならスキーマ化のための要約ポイント（箇条書き3-5行）も併記。\n- EVΛƎ等の特殊理論は使わず、一般的な用語で説明。`;

    return `${header}${body}`.trim();
  }, [title, genre, theme, audience, tone, length, keywords, platform, searchIntent, outlineCount, includeFAQ, includeCTA, ctaText]);

  // フォーム送信（生成）
  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      alert("タイトルは必須です");
      return;
    }
    setOutput(generated);
    // スクロールして出力へ
    setTimeout(() => {
      const el = document.getElementById("output");
      el?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  // クリップボードコピー
  async function handleCopy() {
    if (!output) return alert("先にプロンプトを生成してください");
    try {
      await navigator.clipboard.writeText(output);
      alert("コピーしました！");
    } catch (e) {
      alert("コピーに失敗：手動で選択してコピーしてください");
    }
  }

  // .txt保存
  function handleDownload() {
    if (!output) return alert("先にプロンプトを生成してください");
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(title || "blog").replaceAll("/", "-")}_prompt.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // リセット
  function handleReset() {
    setTitle("");
    setGenre("");
    setTheme("");
    setAudience("");
    setTone("");
    setLength("");
    setKeywords("");
    setPlatform("");
    setSearchIntent("");
    setOutlineCount(5);
    setIncludeFAQ(true);
    setIncludeCTA(true);
    setCtaText("ソウルレイヤー診断（無料）を試す");
    setOutput("");
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 grid gap-6">
        {/* header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Universal Prompt Builder <span className="text-white/60">— Blog専用 β</span>
            </h1>
            <p className="text-white/60 text-sm">AIは使いません。入力→テンプレ整形→コピー／保存だけ。</p>
          </div>
          <span className="text-xs text-white/50">v1.2</span>
        </header>

        {/* 基本情報 */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-4">基本情報</h2>
          <form onSubmit={handleGenerate} className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-white/90">記事タイトル（必須）</label>
                <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：初心者のためのプロンプト設計入門" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/90">カテゴリ</label>
                <input value={genre} onChange={(e)=>setGenre(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：SEO／生成AI／ライティング" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/90">テーマ / 伝えたい一言（任意）</label>
              <input value={theme} onChange={(e)=>setTheme(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：観測が意味を生み、選択が未来を形づくる" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-white/90">想定読者</label>
                <input value={audience} onChange={(e)=>setAudience(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：20–30代のクリエイター" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/90">トーン / 文体</label>
                <input value={tone} onChange={(e)=>setTone(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：明快で実務的、寄り添い系" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/90">分量 / スコープ</label>
                <input value={length} onChange={(e)=>setLength(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：見出し5つ＋本文1500〜2500字" />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-white/90">想定キーワード（,区切り）</label>
                <input value={keywords} onChange={(e)=>setKeywords(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：プロンプト, SEO, 設計, テンプレ" />
              </div>
              <div>
                <label className="text-sm font-medium text-white/90">掲載媒体 / プラットフォーム</label>
                <input value={platform} onChange={(e)=>setPlatform(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：Note / 自社ブログ / Medium" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-white/90">読者の検索意図</label>
              <input value={searchIntent} onChange={(e)=>setSearchIntent(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：最短で“使える”プロンプトが知りたい" />
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-white/90">H2の数</label>
                <input type="number" min={3} max={10} value={outlineCount} onChange={(e)=>setOutlineCount(Number(e.target.value))} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10" />
              </div>
              <div className="flex items-center gap-3 mt-6 md:mt-0">
                <input id="faq" type="checkbox" checked={includeFAQ} onChange={(e)=>setIncludeFAQ(e.target.checked)} className="size-4" />
                <label htmlFor="faq" className="text-sm text-white/90">FAQを含める（3件）</label>
              </div>
              <div className="flex items-center gap-3">
                <input id="cta" type="checkbox" checked={includeCTA} onChange={(e)=>setIncludeCTA(e.target.checked)} className="size-4" />
                <label htmlFor="cta" className="text-sm text-white/90">CTAを含める</label>
              </div>
            </div>

            {includeCTA && (
              <div>
                <label className="text-sm font-medium text-white/90">CTAテキスト</label>
                <input value={ctaText} onChange={(e)=>setCtaText(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：ソウルレイヤー診断（無料）を試す" />
              </div>
            )}

            <div className="grid md:grid-cols-4 gap-3 pt-2">
              <button type="submit" className="rounded-2xl px-4 py-3 font-semibold bg-white text-black hover:opacity-90">プロンプト生成</button>
              <button type="button" onClick={handleCopy} className="rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/15">コピー</button>
              <button type="button" onClick={handleDownload} className="rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/15">.txtで保存</button>
              <button type="button" onClick={handleReset} className="rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/15">リセット</button>
            </div>
          </form>
        </section>

        {/* 出力 */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-4">生成されたプロンプト</h2>
          <textarea id="output" value={output} onChange={(e)=>setOutput(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40 min-h-[220px] font-mono text-sm" placeholder="ここに生成結果が表示されます" />
          <p className="text-xs text-white/50 mt-2">※ このままAIに貼り付けて使えます（本ツール自体はAIを呼びません）。</p>
        </section>

        {/* 診断アプリ誘導 */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base md:text-lg font-semibold">さらに深い体験へ：ソウルレイヤー診断</h3>
              <p className="text-white/70 text-sm">意識の現在地を可視化する診断アプリ。毎日のゆらぎから自分のパターンを観測。</p>
            </div>
            <a href={promoHref} className="rounded-2xl px-4 py-3 font-semibold bg-white text-black hover:opacity-90">ソウルレイヤー診断へ</a>
          </div>
        </section>

        <footer className="text-center text-white/40 text-xs pt-2">
          © Universal Prompt Builder — Blog Edition (EVΛƎロジック不使用)
        </footer>
      </div>
    </div>
  );
}
