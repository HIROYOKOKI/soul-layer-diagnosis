/ =============================================================
style={{
border: '1px solid rgba(255,255,255,.12)',
borderRadius: 14,
padding: 0,
overflow: 'hidden',
background: 'rgba(255,255,255,.06)',
backdropFilter: 'blur(10px) saturate(120%)',
}}
>
<div style={{ padding: 16, borderBottom: '1px solid rgba(255,255,255,.12)' }}>
<div style={{ fontWeight: 700 }}>最近の診断履歴</div>
<div style={{ fontSize: 12, opacity: 0.7, marginTop: 4 }}>直近30件まで表示</div>
</div>

{loading ? (
<div style={{ padding: 16, fontSize: 12, opacity: 0.7 }}>読み込み中...</div>
) : error ? (
<div style={{ padding: 16, fontSize: 12, color: '#ffa2a2' }}>読み込みに失敗しました：{error}</div>
) : !rows || rows.length === 0 ? (
<div style={{ padding: 16, fontSize: 12, opacity: 0.7 }}>まだ保存された診断がありません。</div>
) : (
<ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
{rows.map((r) => {
const code = normalizeCode(r.code)
return (
<li
key={r.id}
style={{
display: 'grid',
gridTemplateColumns: '48px 1fr auto',
alignItems: 'center',
gap: 12,
padding: '12px 16px',
borderTop: '1px solid rgba(255,255,255,.08)',
}}
>
<div
aria-hidden
style={{
width: 36,
height: 36,
borderRadius: 9,
background: code ? codeBadgeColor(code) : '#c7c9d1',
color: '#000',
display: 'grid',
placeItems: 'center',
fontWeight: 900,
}}
title={code}
>
{code || '—'}
</div>
<div>
<div style={{ fontSize: 14, fontWeight: 700 }}>デイリー診断 {code || ''}</div>
<div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>{r.choice || '—'}</div>
{r.theme ? (
<div style={{ fontSize: 11, opacity: 0.6, marginTop: 2 }}>テーマ：{r.theme}</div>
) : null}
</div>
<time style={{ fontSize: 12, opacity: 0.6 }}>{fmt(r.created_at)}</time>
</li>
)
})}
</ul>
)}
</section>
</div>
)
}
