// app/api/_debug/env/route.ts
import { NextResponse } from 'next/server'

export async function GET() {
  const hasUrl = !!process.env.SUPABASE_URL
  const hasRole = !!process.env.SUPABASE_SERVICE_ROLE_KEY
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  const hasPublicUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL

  return NextResponse.json({
    runtime: process.env.NEXT_RUNTIME ?? 'node',
    SUPABASE_URL: hasUrl ? 'set' : 'missing',
    SUPABASE_SERVICE_ROLE_KEY: hasRole ? 'set' : 'missing',
    NEXT_PUBLIC_SUPABASE_URL: hasPublicUrl ? 'set' : 'missing',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: hasAnon ? 'set' : 'missing',
  })
}
