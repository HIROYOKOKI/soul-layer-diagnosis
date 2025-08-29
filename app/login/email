'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

type LoginForm = { email: string; password: string }
type LoginSuccess = { ok: true; token?: string; redirect?: string }
type LoginFailure = { ok: false; error: string }
type LoginResponse = LoginSuccess | LoginFailure

const LOGIN_API = '/api/login' // 必要に応じて変更

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState<LoginForm>({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(LOGIN_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const ct = res.headers.get('content-type') ?? ''
      if (!ct.includes('application/json')) {
        const text = await res.text().catch(() => '')
        throw new Error(text || `HTTP ${res.status}`)
      }
      const data: LoginResponse = await res.json()
      if (!data.ok) throw new Error(data.error)

      const next = 'redirect' in data && data.redirect ? data.redirect : '/mypage'
      router.push(next)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <div className="mb-6 flex items-center gap-2">
        <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={24} priority />
        <h1 className="text-lg font-bold">Login</h1>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span>Email</span>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={onChange}
            required
            className="rounded border border-white/20 bg-black/30 p-2"
          />
        </label>
        <label className="grid gap-1 text-sm">
          <span>Password</span>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={onChange}
            required
            className="rounded border border-white/20 bg-black/30 p-2"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded bg-white/10 px-4 py-2 font-semibold hover:bg-white/20 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'Sign in'}
        </button>

        {error && <p className="text-sm text-red-400">{error}</p>}
      </form>
    </div>
  )
}
