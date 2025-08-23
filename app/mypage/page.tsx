'use client'
import { useEffect } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'

async function testInsertDaily() {
  const supabase = await getBrowserSupabase()

  // ① セッション確認（未ログインなら /login/form へ）
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    window.location.href = '/login/form'
    return
  }

  // ② 挿入テスト
  const uid = session.user.id
  const { error } = await supabase.from('daily_results').insert({
    user_id: uid,
    theme: 'work',
    choice: 'E',
    structure_score: { E: 1, V: 0, Λ: 0, Ǝ: 0 },
    comment: 'RLS test',
    advice: '静かに前進',
  })
  console.log('insert error:', error)
}

export default function MyPage() {
  useEffect(() => { void testInsertDaily() }, [])
  return <main style={{ padding: 20 }}>マイページ（挿入テスト中）</main>
}
