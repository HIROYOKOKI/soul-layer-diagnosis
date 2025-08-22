'use client'

export default function LoginDebug() {
  return (
    <main style={{
      minHeight:'100dvh', background:'#000', color:'#fff',
      display:'grid', placeItems:'center'
    }}>
      <div style={{display:'grid', gap:12, textAlign:'center'}}>
        <h1 style={{margin:0}}>LOGIN DEBUG</h1>
        <a href="/login/form" style={btn}>/login/form へ</a>
        <a href="/login/form?mode=signup" style={btn}>/login/form?mode=signup へ</a>
      </div>
    </main>
  )
}

const btn: React.CSSProperties = {
  display:'inline-block', padding:'12px 18px', borderRadius:12,
  background:'#1e90ff', color:'#fff', textDecoration:'none'
}
