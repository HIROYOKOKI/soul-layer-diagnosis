// app/intro/layout.tsx
export default function IntroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black text-white overflow-x-hidden min-h-[100dvh]">
      {children}
    </div>
  )
}
