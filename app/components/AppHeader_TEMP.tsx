import Image from "next/image"

export default function AppHeader() {
  return (
    <header className="relative z-50 flex items-center justify-between px-5 py-3">
      <div className="flex items-center gap-3">
        <Image
          src="/icon-512.png"
          alt="Soul Layer Logo"
          width={32}
          height={32}
          priority
          className="rounded-full border border-gray-700"
        />
        <span className="tracking-[0.28em] text-xs md:text-sm text-white/90">
          SOUL LAYER DIAGNOSIS
        </span>
      </div>
      <div className="w-6 h-6" />
    </header>
  )
}
