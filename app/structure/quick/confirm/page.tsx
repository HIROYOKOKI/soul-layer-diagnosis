'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ConfirmPage() {
  const router = useRouter()
  const [ok, setOk] = useState(false)
  const [order, setOrder] = useState<string[]>([])

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('structure_quick_pending')
      const p = raw ? JSON.parse(raw) : null
      if (!p?.order || p.order.length !== 4) {
        router.replace('/structure/quick')
      } else {
        setOrder(p.order)
        setOk(true)
      }
    } catch {
      router.replace('/structure/quick')
    }
  }, [router])

  if (!ok) return null

  return (
    <div className="min-h-screen grid place-items-center bg-black text-white">
      <div className="w-full max-w-md p-6">
        <h1 className="text-center text-xl font-bold mb-4">確認</h1>
        <ol className="space-y-2 mb-6">{order.map((c,i)=><li key={c}>{`第${i+1}位：${c}`}</li>)}</ol>
        <div className="grid gap-3">
          <button className="rounded-lg bg-pink-600 py-2 font-bold"
            onClick={()=>router.push('/structure/quick/result')}>
            この内容で診断
          </button>
          <button className="rounded-lg border border-white/20 py-2"
            onClick={()=>router.replace('/structure/quick')}>
            修正する（戻る）
          </button>
        </div>
      </div>
    </div>
  )
}
