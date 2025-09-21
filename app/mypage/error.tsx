// app/mypage/error.tsx
'use client'
export default function Error({ error }: { error: Error }) {
  return (
    <pre className="p-4 text-red-400 whitespace-pre-wrap">
      /mypage error: {String(error?.message || 'unknown')}
      {'\n'}
      {error?.stack}
    </pre>
  )
}
