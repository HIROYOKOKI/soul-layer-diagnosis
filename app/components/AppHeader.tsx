"use client";

export default function AppHeader() {
  return (
    <header className="fixed inset-x-0 top-0 z-40 border-b border-white/10 bg-black/60 backdrop-blur supports-[backdrop-filter]:bg-black/40">
      <div className="mx-auto flex h-16 max-w-6xl items-center px-4 sm:px-6">
        <a href="/" className="flex items-center gap-3">
          <img
            src="/icon-512.png"
            alt="App Icon"
            className="h-8 w-8 rounded-full ring-4 ring-[#00f]/80 shadow-[0_0_12px_#00f,0_0_24px_#3399ff,0_0_36px_#66ccff]"
          />
          <img
            src="/soul-layer-diagnosis.png"
            alt="Soul Layer Diagnosis"
            className="h-7 sm:h-8"
          />
        </a>
      </div>
    </header>
  );
}
