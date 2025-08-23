import { getBrowserSupabase } from '@/lib/supabase-browser'

export async function testInsertDaily() {
  const supabase = await getBrowserSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return console.error('not signed in')

  const { error } = await supabase.from('daily_results').insert({
    user_id: user.id,
    theme: 'work',
    choice: 'E',
    structure_score: { E: 1, V: 0, Λ: 0, Ǝ: 0 },
    comment: 'RLS test',
    advice: '静かに前進',
  })
  console.log('insert error:', error)
}
