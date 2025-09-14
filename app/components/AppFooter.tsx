"use client";

import Link from "next/link";

export default function AppFooter() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-black/60 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm text-white/70 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>© {new Date().getFullYear()} EVΛƎ Project. All rights reserved.</div>
        <nav className="flex flex-wrap gap-3">
          <Link href="/about" className="hover:text-white">About</Link>
          <Link href="/terms" className="hover:text-white">利用規約</Link>
          <Link href="/privacy" className="hover:text-white">プライバシー</Link>
          <a href="https://note.com/heroy" target="_blank" className="hover:text-white">Note</a>
        </nav>
      </div>
    </footer>
  );
}
