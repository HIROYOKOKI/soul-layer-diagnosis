'use client'

import GlowButton from '@/components/GlowButton'

export default function ButtonsGallery() {
  return (
    <main style={S.page}>
      <h1 style={S.h1}>GlowButton Variations</h1>

      <section style={S.section}>
        <h2 style={S.h2}>Primary</h2>
        <div style={S.row}>
          <GlowButton variant="primary">Primary</GlowButton>
          <GlowButton variant="primary" size="md">Small</GlowButton>
          <GlowButton variant="primary" loading>Loading</GlowButton>
          <GlowButton variant="primary" disabled>Disabled</GlowButton>
        </div>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>Secondary</h2>
        <div style={S.row}>
          <GlowButton variant="secondary">Secondary</GlowButton>
          <GlowButton variant="secondary" size="md">Small</GlowButton>
        </div>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>Danger</h2>
        <div style={S.row}>
          <GlowButton variant="danger">Danger</GlowButton>
          <GlowButton variant="danger" size="md">Small</GlowButton>
        </div>
      </section>

      <section style={S.section}>
        <h2 style={S.h2}>Width / Alignment</h2>
        <div style={S.row}>
          <GlowButton fullWidth={false}>Auto Width</GlowButton>
          <div style={{flex:1,textAlign:'right'}}>
            <GlowButton fullWidth={false}>Right Aligned</GlowButton>
          </div>
        </div>
      </section>
    </main>
  )
}

const S: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    background: 'radial-gradient(circle at top, #05060a, #000 80%)',
    color: '#fff',
    padding: '32px 20px',
    fontFamily: 'ui-sans-serif, SF Pro Text, Helvetica, Arial',
  },
  h1: { fontSize: 28, marginBottom: 24, letterSpacing: '.08em' },
  h2: { fontSize: 18, marginBottom: 12, marginTop: 28, opacity:.8 },
  section: { marginBottom: 32 },
  row: { display:'flex', gap:16, flexWrap:'wrap', alignItems:'center' },
}
