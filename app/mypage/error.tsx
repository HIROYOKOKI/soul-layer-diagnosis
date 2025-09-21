'use client'

export default function Error({ error }: { error: Error }) {
  return (
    <div className="p-6 text-red-400 whitespace-pre-wrap">
      /mypage error: {error?.message || 'unknown'}
      {"\n"}
      {error?.stack}
    </div>
  )
}
