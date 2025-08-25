"use client";

import { useState, useMemo } from "react";

/**
 * Universal Prompt Builder — Blog専用（単独ページ）
 * ルート: /prompt-builder
 * 依存: Tailwind CSS（globals.css にテーマ変数あり）
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
  const [promoHref] = useState("/daily"); // 必要に応じて差し替え
  const [output, setOutput] = useState("");

  // ====== 生成ロジック ======
  const generated = useMemo(() => {
    if (!title.trim()) return "";
    const oc = Math.max(3, Math.min(10, outlineCount || 5));

    const header =
      `あなたはSEOと読者体験に強い編集者AIです。以下の条件で「構成案（見出し）」と「本文ドラフト」を日本語で作成してください。`;

    const body = `
# 記事タイトル
「${title.trim()}」

# カテゴリ
${genre.trim() || "（未指定：適宜設定）"}

# 想定読者
${audience.trim() || "初心者"}

# 検索意図
${searchIntent.trim() || "短時間で“使える”実践ポイントが知りたい"}

# 主要キーワード（,区切り）
${keywords.trim() || "（必要に応じて選定）"}

# 掲載プラットフォーム
${platform.trim() || "自社ブログ"}

# トーン
${tone.trim() || "明快で具体的。専門用語は短く補足"}

# 分量ガイド
${length.trim() || `見出し${oc}つ＋本文合計1500〜2500字`}

# 書き方・制約
- まず120〜160字の要約（メタディスクリプション想定）。
- H2を${oc}個、必要に応じてH3を追加。
- 各H2配下に300〜500字の本文ドラフト。
- 重要箇所は**太字**で強調語を1つまで。
- テンポの良い短文と箇条書きを織り交ぜて可読性を高める。
- 事例/手順/チェックリストを最小1つ入れる。
${includeFAQ ? "- 最後にFAQを3件。\n" : ""}${includeCTA ? `- 最後に明確なCTAを1つ（例：「${ctaText}」）。\n` : ""}- 可能ならスキーマ化のための要約ポイント（箇条書き3-5行）も併記。
- EVΛƎ等の特殊理論は使わず、一般的な用語で説明。`.trim();

    return `${header}\n\n${body}`;
  }, [title, genre, audience, tone, length, keywords, platform, searchIntent, outlineCount, includeFAQ, includeCTA, ctaText]);

  // フォーム送信（生成）
  function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      alert("タイトルは必須です");
      return;
    }
    setOutput(generated);
    setTimeout(() => {
      document.getElementById("output")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  // クリップボードコピー
  async function handleCopy() {
    if (!output) return alert("先にプロンプトを生成してください");
    try {
      await navigator.clipboard.writeText(output);
      alert("コピーしました！");
    } catch {
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
    <div className="bg-[var(--bg)] text-[var(--fg)]">
      {/* 固定スクロール：画面は固定し、中でのみ縦スクロール */}
      <div className="fixed inset-0 overflow-y-auto overscroll-contain h-dvh [@supports(height:100svh)]:h-[100svh] -webkit-overflow-scrolling-touch">
        <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 grid gap-6 text-white/80">
          {/* header */}
          <header className="flex items-center justify-between text-white">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
                Universal Prompt Builder <span className="text-white/60">— Blog専用 β</span>
              </h1>
              <p className="text-white/60 text-sm">AIは使いません。入力→テンプレ整形→コピー／保存だけ。</p>
            </div>
            <span className="text-xs text-white/50">v1.2</span>
          </header>

          {/* 基本情報（カード化） */}
          <section className="rounded-2xl bg-[var(--panel)] border border-[var(--border)] shadow-lg p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">基本情報</h2>
            <form onSubmit={handleGenerate} className="grid gap-5">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">記事タイトル（必須）</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40"
                    placeholder="例：初心者のためのプロンプト設計入門"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">カテゴリ</label>
                  <input
                    value={genre}
                    onChange={(e) => setGenre(e.target.value)}
                    className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40"
                    placeholder="例：SEO／生成AI／ライティング"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">テーマ / 伝えたい一言（任意）</label>
                <input
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40"
                  placeholder="例：観測が意味を生み、選択が未来を形づくる"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">想定読者</label>
                  <input
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40"
                    placeholder="例：20–30代のクリエイター"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">トーン / 文体</label>
                  <input
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text白 px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40"
                    placeholder="例：明快で実務的、寄り添い系"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">分量 / スコープ</label>
                  <input
                    value={length}
                    onChange={(e) => setLength(e.target.value)}
                    className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40"
                    placeholder="例：見出し5つ＋本文1500〜2500字"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">想定キーワード（,区切り）</label>
                  <input
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40"
                    placeholder="例：プロンプト, SEO, 設計, テンプレ"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">掲載媒体 / プラットフォーム</label>
                  <input
                    value={platform}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40"
                    placeholder="例：Note / 自社ブログ / Medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-1">読者の検索意図</label>
                <input
                  value={searchIntent}
                  onChange={(e) => setSearchIntent(e.target.value)}
                  className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40"
                  placeholder="例：最短で“使える”プロンプトが知りたい"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">H2の数</label>
                  <input
                    type="number"
                    min={3}
                    max={10}
                    value={outlineCount}
                    onChange={(e) => setOutlineCount(Number(e.target.value))}
                    className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30"
                  />
                </div>
                <label className="flex items-center gap-3 mt-1 md:mt-6">
                  <input
                    id="faq"
                    type="checkbox"
                    checked={includeFAQ}
                    onChange={(e) => setIncludeFAQ(e.target.checked)}
                    className="size-4 accent-white"
                  />
                  <span className="text-sm">FAQを含める（3件）</span>
                </label>
                <label className="flex items-center gap-3 mt-1 md:mt-6">
                  <input
                    id="cta"
                    type="checkbox"
                    checked={includeCTA}
                    onChange={(e) => setIncludeCTA(e.target.checked)}
                    className="size-4 accent-white"
                  />
                  <span className="text-sm">CTAを含める</span>
                </label>
              </div>

              {includeCTA && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-1">CTAテキスト</label>
                  <input
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40"
                    placeholder="例：ソウルレイヤー診断（無料）を試す"
                  />
                </div>
              )}

              <div className="grid md:grid-cols-4 gap-3 pt-2">
                <button type="submit" className="rounded-xl px-4 py-3 font-semibold text-black bg-[var(--accent)] shadow-[var(--accent-shadow)] hover:shadow-[var(--accent-shadow-strong)] transition">
                  プロンプト生成
                </button>
                <button type="button" onClick={handleCopy} className="rounded-xl px-4 py-3 font-semibold text-white bg-[var(--panel)] border border-[var(--border)] hover:opacity-90 transition">
                  コピー
                </button>
                <button type="button" onClick={handleDownload} className="rounded-xl px-4 py-3 font-semibold text-white bg-[var(--panel)] border border-[var(--border)] hover:opacity-90 transition">
                  .txtで保存
                </button>
                <button type="button" onClick={handleReset} className="rounded-xl px-4 py-3 font-semibold text-white bg-[var(--panel)] border border-[var(--border)] hover:opacity-90 transition">
                  リセット
                </button>
              </div>
            </form>
          </section>

          {/* 出力 */}
          <section className="rounded-2xl bg-[var(--panel)] border border-[var(--border)] shadow-lg p-5 md:p-6">
            <h2 className="text-lg md:text-xl font-semibold mb-4 text-white">生成されたプロンプト</h2>
            <textarea
              id="output"
              value={output}
              onChange={(e) => setOutput(e.target.value)}
              className="w-full rounded-xl bg-[var(--panel)] border border-[var(--border)] text-white px-3 py-3 outline-none focus:ring-2 focus:ring-white/30 placeholder:text-white/40 min-h-[220px] font-mono text-sm"
              placeholder="ここに生成結果が表示されます"
            />
            <p className="text-xs text-white/50 mt-2">
              ※ このままAIに貼り付けて使えます（本ツール自体はAIを呼びません）。
            </p>
          </section>

          {/* 診断アプリ誘導 */}
          <section className="rounded-2xl bg-[var(--panel)] border border-[var(--border)] shadow-lg p-5 md:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div>
                <h3 className="text-base md:text-lg font-semibold text-white">さらに深い体験へ：ソウルレイヤー診断</h3>
                <p className="text-white/70 text-sm">
                  意識の現在地を可視化する診断アプリ。毎日のゆらぎから自分のパターンを観測。
                </p>
              </div>
              <a
                href={promoHref}
                className="rounded-xl px-4 py-3 font-semibold text-black bg-[var(--accent)] shadow-[var(--accent-shadow)] hover:shadow-[var(--accent-shadow-strong)] no-underline transition"
              >
                ソウルレイヤー診断へ
              </a>
            </div>
          </section>

          <footer className="text-center text-white/40 text-xs pt-2">
            © Universal Prompt Builder — Blog Edition (EVΛƎロジック不使用)
          </footer>
        </div>
      </div>
    </div>
  );
}
