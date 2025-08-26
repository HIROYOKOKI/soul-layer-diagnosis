// app/profile/result/page.tsx

'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

// 型定義
interface Profile {
  id: string
  name: string
  birthday: string
  blood: string
  gender: string
  preference?: string | null
  created_at?: string
}

export default function ProfileResultPage() {
  const sp = useSearchParams()
  const id = sp.get('id')

  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchById() {
      try {
        if (!id) {
          setError('Invalid link')
          return
        }
        const res = await fetch(`/api/profile/${id}`, { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch profile')
        const data: Profile = await res.json()
        setProfile(data)
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }
    fetchById()
  }, [id])

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>
  if (error) return <div className="min-h-screen bg-black text-red-400 flex items-center justify-center">{error}</div>

  return (
    <div className="min-h-screen flex flex-col bg-black text-white">
      <header className="w-full p-4 flex justify-center">
        <img src="/evae-logo.svg" alt="EVΛƎ" className="h-8" />
      </header>

      <main className="flex flex-1 items-center justify-center px-4">
        <div className="bg-neutral-900/70 rounded-xl p-6 shadow-lg border border-white/10 w-full max-w-md">
          <h2 className="text-center text-lg font-bold mb-4">保存完了</h2>

          {profile ? (
            <ul className="space-y-2 text-sm">
              <li className="flex justify-between"><span>NAME</span><span>{profile.name}</span></li>
              <li className="flex justify-between"><span>DATE OF BIRTH</span><span>{profile.birthday}</span></li>
              <li className="flex justify-between"><span>BLOOD TYPE</span><span>{profile.blood}</span></li>
              <li className="flex justify-between"><span>GENDER</span><span>{profile.gender}</span></li>
              <li className="flex justify-between"><span>PREFERENCE</span><span>{profile.preference ?? '—'}</span></li>
            </ul>
          ) : (
            <p className="text-center text-gray-400">データがありません</p>
          )}
        </div>
      </main>

      <footer className="w-full py-4 text-center text-xs text-white/40">
        © 2025 Soul Layer Log
      </footer>
    </div>
  )
}

// app/api/profile/[id]/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export const runtime = 'nodejs'

function getSupabase() {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const supabase = getSupabase()
  if (!supabase) {
    return NextResponse.json({ error: 'Server env not set' }, { status: 500 })
  }

  const { data, error } = await supabase
    .from('profile_results')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
