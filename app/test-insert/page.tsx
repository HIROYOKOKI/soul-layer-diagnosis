'use client'

import { testInsertDaily } from '@/lib/testInsertDaily'

export default function TestInsertPage() {
  return (
    <main style={{ padding: 20 }}>
      <h1>Insert Test</h1>
      <button onClick={testInsertDaily}>Insert Daily Result</button>
    </main>
  )
}
