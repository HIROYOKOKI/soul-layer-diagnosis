// app/mypage/error.tsx
'use client'

export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-6 text-red-400 whitespace-pre-wrap">
      <h2>/mypage error</h2>
      <pre>{String(error?.message || 'unknown')}</pre>
      <pre>{error?.stack}</pre>
    </div>
  )
}
