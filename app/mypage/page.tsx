'use client'

import { useEffect } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'

async function testInsertDaily() {
  const supabase = await getBrowserSupabase()
  const { data: { user }, error: userErr } = await supabase.auth.getUser()
  if (userErr || !user) {
    console.error('not signed in', userErr)
    return
  }

  const { error } = await supabase.from('daily_results').insert({
    user_id: user.id,
    theme: 'work',
    choice: 'E',
    structure_score: { E: 1, V: 0, Λ: 0, Ǝ: 0 },
    comment: 'RLS test',
    advice: '静かに前進',
  })
  console.log('insert error:', error) // ← nullなら成功
}

export default function MyPage() {
  useEffect(() => { void testInsertDaily() }, [])
  return (
    <main style={{ padding: 20, minHeight: '100dvh', background: '#000', color: '#fff' }}>
      <h1>マイページ（挿入テスト中）</h1>
      <p>DevTools Console に <code>insert error: null</code> が出ればOK。</p>
    </main>
  )
}
