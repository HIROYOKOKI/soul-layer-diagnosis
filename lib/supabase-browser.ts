export async function getBrowserSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !anon) {
    // ブラウザならユーザーに見せるための安全なエラーハンドリング
    throw new Error('Supabase 環境変数(NEXT_PUBLIC_*)が未設定です')
  }
  const { createClient } = await import('@supabase/supabase-js')
  return createClient(url, anon)
}
