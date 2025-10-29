// AppFooter.tsx（要点だけ）
export default function AppFooter() {
  return (
    <footer
      style={{
        position: 'static',     // ← sticky をやめる
        background: 'rgba(6,7,10,.85)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255,255,255,.08)',
        zIndex: 50,             // 念のため前面へ
      }}
    >
      {/* ... */}
    </footer>
  );
}
