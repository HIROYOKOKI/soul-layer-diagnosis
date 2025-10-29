"use client";

import Link from "next/link";

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer
      style={{
        position: "static",
        background: "rgba(6,7,10,.85)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        borderTop: "1px solid rgba(255,255,255,.08)",
        color: "rgba(255,255,255,0.8)",
        padding: "1rem 0",
        textAlign: "center",
        fontSize: "0.85rem",
        lineHeight: "1.6",
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginBottom: "0.5rem" }}>
        <Link href="/legal/terms" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>
          利用規約
        </Link>
        <Link href="/legal/privacy" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>
          プライバシー
        </Link>
        <Link href="/contact" style={{ color: "rgba(255,255,255,0.75)", textDecoration: "none" }}>
          お問い合わせ
        </Link>
      </div>

      <div style={{ opacity: 0.8 }}>
        © {year} Amuletplus / EVΛƎ Project
      </div>
    </footer>
  );
}
