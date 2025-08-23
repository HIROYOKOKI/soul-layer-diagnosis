'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase-browser'

export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    const run = async () => {
      const supabase = await getBrowserSupabase()

      // メール確認／Magic Link／OAuth で返ってきた code をセッションに交換
      const { error } = await supabase.auth.exchangeCodeForSession(window.location.href)
      if (error) {
        console.error('exchange error:', error.message)
        // 失敗してもログインページへ誘導
        router.replace('/login/form')
        return
      }

      // 成功 → マイページへ
      router.replace('/mypage')
    }
    void run()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <main style={{minHeight:'100dvh',display:'grid',placeItems:'center',background:'#000',color:'#fff'}}>
      <p>認証処理中…</p>
    </main>
  )
}
