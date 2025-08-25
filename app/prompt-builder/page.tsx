"use client";

import { useEffect, useMemo, useRef, useState } from "react";

/**
 * Universal Prompt Builder — Blog専用（単一ファイル）
 * 使い方: このファイルを `app/prompt-builder/page.tsx` に配置
 * Tailwind が有効な Next.js (App Router) 環境を想定
 *
 * 特徴:
 * - ブログ記事に特化した入力項目のみ
 * - 生成→コピー→.txt保存→リセット
 * - ローカル保存 (localStorage) オートロード
 * - ソウルレイヤー診断への誘導ボタン
 */

export default function Page() {
  // ====== 入力状態 ======
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [theme, setTheme] = useState("");
  const [audience, setAudience] = useState("");
  const [tone, setTone] = useState("");
  const [length, setLength] = useState("");

  const [keywords, setKeywords] = useState("");
  const [platform, setPlatform] = useState("");
  const [searchIntent, setSearchIntent] = useState("");

  const [output, setOutput] = useState("");

  // ====== 保存・ロード ======
  const STORAGE_KEY = "upb-blog-only-v1";
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const v = JSON.parse(raw);
      setTitle(v.title || "");
      setGenre(v.genre || "");
      setTheme(v.theme || "");
      setAudience(v.audience || "");
      setTone(v.tone || "");
      setLength(v.length || "");
      setKeywords(v.keywords || "");
      setPlatform(v.platform || "");
      setSearchIntent(v.searchIntent || "");
    } catch {}
  }, []);

  useEffect(() => {
    const payload = {
      title,
      genre,
      theme,
      audience,
      tone,
      length,
      keywords,
      platform,
      searchIntent,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {}
  }, [title, genre, theme, audience, tone, length, keywords, platform, searchIntent]);

  // ====== 生成ロジック ======
  const generated = useMemo(() => {
    if (!output) return null;
    return output;
  }, [output]);

  const generate = () => {
    const baseTitle = title.trim();
    const baseGenre = genre.trim();
    const baseTheme = theme.trim();
    const baseAudience = audience.trim() || "初心者";
    const baseTone = tone.trim() || "明快で具体的";
    const baseLength = length.trim() || "見出し5つ＋本文計1500〜2500字";

    const kws = keywords.trim() || "（必要に応じて選定）";
    const plat = platform.trim() || "自社ブログ";
    const intent = searchIntent.trim() || "このテーマの基本と実践を短時間で知りたい";

    const prompt = `\nあなたはSEOに配慮する編集者AIです。以下の条件で「構成案（見出し）」と「本文ドラフト」を作成してください。\n\n# 記事タイトル\n「${baseTitle}」\n\n# カテゴリ\n${baseGenre}\n\n# 想定読者\n${baseAudience}\n\n# 検索意図\n${intent}\n\n# 主要キーワード\n${kws}\n\n# プラットフォーム\n${plat}\n\n# テーマ（本文で芯として扱う一言）\n${baseTheme}\n\n# 書き方・制約\n- トーン：${baseTone}\n- 分量：${baseLength}\n- 出力：\n  1) 要約（120〜160字）\n  2) 見出し構成（H2/H3）\n  3) 本文ドラフト（各見出し300〜500字）\n  4) FAQ 3件\n  5) CTA（次の行動を1つ）\n- 日本語で出力`.trim();

    setOutput(prompt);
    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
    }, 0);
  };

  // ====== アクション ======
  const copyToClipboard = async () => {
    if (!output) return alert("先にプロンプトを生成してください");
    try {
      await navigator.clipboard.writeText(output);
      alert("コピーしました！");
    } catch {
      alert("コピーに失敗：手動で選択してコピーしてください");
    }
  };

  const downloadTxt = () => {
    if (!output) return alert("先にプロンプトを生成してください");
    const blob = new Blob([output], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title || "prompt"}_blog_prompt.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const resetAll = () => {
    setTitle("");
    setGenre("");
    setTheme("");
    setAudience("");
    setTone("");
    setLength("");
    setKeywords("");
    setPlatform("");
    setSearchIntent("");
    setOutput("");
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  };

  // ====== UI ======
  const PROMO_URL = "https://salmon385780.studio.site"; // 必要に応じて差し替え

  return (
    <div className="bg-black text-white min-h-screen">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 grid gap-6">
        {/* Header */}
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight">
              Universal Prompt Builder <span className="text-white/60">β</span>
            </h1>
            <p className="text-white/60 text-sm">AIは使いません。入力→テンプレ整形→コピー／保存だけ。</p>
          </div>
          <span className="text-xs text-white/50">blog-only v1.0</span>
        </header>

        {/* 基本情報 */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-4">基本情報</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white/90">記事タイトル</label>
              <input value={title} onChange={(e)=>setTitle(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：AIを使わずに“使える”テンプレを作る方法" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/90">カテゴリ</label>
              <input value={genre} onChange={(e)=>setGenre(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：SEO／プロンプト／ビジネス" />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-white/90">テーマ / 伝えたい一言</label>
            <input value={theme} onChange={(e)=>setTheme(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：観測が意味を生み、選択が未来を形づくる" />
          </div>
          <div className="grid md:grid-cols-3 gap-4 mt-4">
            <div>
              <label className="text-sm font-medium text-white/90">想定読者</label>
              <input value={audience} onChange={(e)=>setAudience(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：20–30代のクリエイター" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/90">トーン / 文体</label>
              <input value={tone} onChange={(e)=>setTone(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：明快で具体的" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/90">分量 / スコープ</label>
              <input value={length} onChange={(e)=>setLength(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：見出し5つ＋本文計1500〜2500字" />
            </div>
          </div>
        </section>

        {/* ブログ追加情報 */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <h3 className="text-base md:text-lg font-semibold mb-3">ブログ：追加情報</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-white/90">想定キーワード（,区切り）</label>
              <input value={keywords} onChange={(e)=>setKeywords(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：SEO, プロンプト, 初心者" />
            </div>
            <div>
              <label className="text-sm font-medium text-white/90">掲載媒体 / プラットフォーム</label>
              <input value={platform} onChange={(e)=>setPlatform(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：Note / 自社ブログ / Medium" />
            </div>
          </div>
          <div className="mt-4">
            <label className="text-sm font-medium text-white/90">読者の検索意図</label>
            <input value={searchIntent} onChange={(e)=>setSearchIntent(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40" placeholder="例：最短で“使える”プロンプトが知りたい" />
          </div>
        </section>

        {/* アクション */}
        <div className="grid md:grid-cols-4 gap-3">
          <button onClick={generate} className="rounded-2xl px-4 py-3 font-semibold bg-white text-black hover:opacity-90">プロンプト生成</button>
          <button onClick={copyToClipboard} className="rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/15">コピー</button>
          <button onClick={downloadTxt} className="rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/15">.txtで保存</button>
          <button onClick={resetAll} className="rounded-2xl px-4 py-3 bg-white/10 hover:bg-white/15">リセット</button>
        </div>

        {/* 出力 */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <h2 className="text-lg md:text-xl font-semibold mb-4">生成されたプロンプト</h2>
          <textarea value={generated || ""} onChange={(e)=>setOutput(e.target.value)} className="w-full rounded-xl bg-white/5 text-white px-3 py-2 outline-none focus:bg-white/10 placeholder:text-white/40 min-h-[220px] font-mono text-sm" placeholder="ここに生成結果が表示されます" />
          <p className="text-xs text-white/50 mt-2">※ このままAIに貼り付けて使えます（本ツール自体はAIを呼びません）。</p>
        </section>

        {/* 診断アプリ誘導 */}
        <section className="bg-white/5 border border-white/10 rounded-2xl p-5 md:p-6 shadow">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base md:text-lg font-semibold">さらに深い体験へ：ソウルレイヤー診断</h3>
              <p className="text-white/70 text-sm">意識の現在地を可視化する診断アプリ。毎日のゆらぎから自分のパターンを観測。</p>
            </div>
            <a href={PROMO_URL} target="_blank" className="rounded-2xl px-4 py-3 font-semibold bg-white text-black hover:opacity-90">ソウルレイヤー診断へ</a>
          </div>
        </section>

        <footer className="text-center text-white/40 text-xs pt-2">
          © Universal Prompt Builder — Blog Edition (EVΛƎロジック不使用)
        </footer>
      </div>
    </div>
  );
}
