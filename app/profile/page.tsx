"use client";

import { type CSSProperties, type FormEvent, useState } from "react";

/* ===== module-scope consts (関数の外) ===== */
const glow = "0 0 12px rgba(0,180,255,.8), 0 0 24px rgba(150,0,255,.6)";

export default function ProfilePage() {
  const [name, setName] = useState("");
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert("テスト保存");
  };

  return (
    <div style={S.page}>
      {/* ヘッダー（EVΛƎロゴ） */}
      <header style={S.header}>
        <img src="/evae-logo.svg" alt="EVΛƎ" style={S.logoHeader} />
      </header>

      {/* カード */}
      <div style={S.card}>
        <h1 style={S.title}>PROFILE</h1>
        <form onSubmit={handleSubmit} style={S.form}>
          <label style={S.label}>NAME</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your name"
            style={S.input}
          />
          <button type="submit" style={S.button}>SAVE</button>
        </form>
      </div>

      {/* フッター（SVGロゴ） */}
     <footer style={S.footer}>
  <img
    src="/soul-layer-diagnosis.v2.svg?v=20250824l"
    alt="Soul Layer Diagnosis"
    style={S.logoFooter}
    onError={(e) => {
      e.currentTarget.src = "/soul-layer-diagnosis.v2.png?v=1"; // SVG失敗時にPNGに切替
    }}
  />
</footer>



    　{/* iOSフォーム対策 */}
      <style jsx global>{`
        input, select, button { font-size:16px !important; line-height:1.4 !important; }
        @supports (-webkit-touch-callout: none) { select { font-size:17px !important; } }
      `}</style>
    </div>
  );
}

/* ===== styles ===== */
const S: Record<string, CSSProperties> = {
  page: {
    minHeight: "100dvh",
    background: "radial-gradient(1200px 600px at 50% -10%, rgba(120,0,255,.25), transparent 70%) #000",
    color: "#dff2ff",
  },
  header: { display: "flex", justifyContent: "center", padding: "24px 0 8px" },
  logoHeader: { height: 28, width: "auto", filter: "drop-shadow(0 0 10px rgba(180,220,255,.8))" },
  card: {
    width: "min(640px, 92vw)",
    margin: "24px auto",
    padding: 24,
    borderRadius: 24,
    background: "linear-gradient(180deg, rgba(20,22,30,.9), rgba(10,12,16,.9))",
    boxShadow: `0 0 0 1px rgba(120,140,200,.15), 0 12px 40px rgba(90,0,160,.35), ${glow}`,
  },
  title: { letterSpacing: 6, textAlign: "center", fontSize: 20, margin: "6px 0 20px", color: "#9dd6ff" },
  form: { display: "grid", gap: 12 },
  label: { fontSize: 12, letterSpacing: 2, color: "rgba(160,200,255,.8)" },
  input: {
    background: "rgba(255,255,255,.03)",
    border: "1px solid rgba(160,200,255,.18)",
    borderRadius: 12,
    color: "#e6f6ff",
    padding: "14px 16px",
    outline: "none",
  },
  button: {
    height: 56,
    borderRadius: 28,
    border: "none",
    color: "#fff",
    fontWeight: 700,
    letterSpacing: 2,
    background: "linear-gradient(90deg, #2ea8ff, #8b3dff)",
    boxShadow: `0 0 0 1px rgba(120,140,200,.15), ${glow}`,
    cursor: "pointer",
  },
 footer: { padding: "24px 0 36px", display: "flex", justifyContent: "center" },
  logoFooter: { width: 220, height: "auto", filter: "drop-shadow(0 0 12px rgba(0,180,255,.6))" },
}; 
