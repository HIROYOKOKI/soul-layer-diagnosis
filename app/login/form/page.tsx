'use client'

import { useState, type FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase-browser'

export default function LoginFormPage() {
  const router = useRouter()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const supabase = await getBrowserSupabase()

      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
        router.push('/daily') // ← ログイン後の遷移先。必要に応じて変更
      } else {
        // サインアップ（確認メールを要求する設定ならメール確認後にログイン可）
        const { error } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        router.push('/login/form?signup=ok')
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : 'エラーが発生しました'
      setError(humanizeAuthError(msg))
    } finally {
      setLoading(false)
    }
  }

  const sendReset = async () => {
    try {
      const supabase = await getBrowserSupabase()
      // ここでパスワード再設定メールを送る（リダイレクトURLはプロジェクトURLでOK）
      const { error } = await supabase.auth.resetPasswordForEmail(email || '', {
        redirectTo: `${location.origin}/login/form`,
      })
      if (error) throw error
      alert('再設定メールを送信しました。受信箱をご確認ください。')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'メール送信に失敗しました'
      setError(humanizeAuthError(msg))
    }
  }

  return (
    <main style={page}>
      <section style={card} aria-live="polite">
        <h1 style={title}>{mode === 'login' ? 'ログ
