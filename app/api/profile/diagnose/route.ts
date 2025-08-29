import { NextResponse } from 'next/server'

// 型・ユーティリティ
type Season = '春'|'夏'|'秋'|'冬'|''
function seasonOf(dateISO: string): Season {
  try { const m = new Date(dateISO).getMonth() + 1; return m<=2?'冬':m<=5?'春':m<=8?'夏':'秋'; } catch { return '' }
}
function weekdayOf(dateISO: string) {
  try { const n = new Date(dateISO).getDay(); return ['日曜','月曜','火曜','水曜','木曜','金曜','土曜'][n] } catch { return '' }
}
function weekdayGroup(w: string){
  if (w==='月曜' || w==='木曜') return { key:'集中', tip:'深く集中する日' }
  if (w==='火曜') return { key:'交渉', tip:'対話と交渉が進む日' }
  if (w==='水曜') return { key:'整備', tip:'整えるほど冴える日' }
  if (w==='金曜') return { key:'交流', tip:'発信と共有が活きる日' }
  return { key:'休息', tip:'休むことで満ちる日' } // 土/日
}
function toRange2para(par1: string, par2: string, min = 200, max = 300) {
  let t = `${par1.trim()}\n\n${par2.trim()}`.replace(/\s+$/,'')
  if (t.length < min) {
    t += ' 小さな一歩を重ねるほど基盤が整い、偶然の縁が味方します。焦らず、しかし歩みを止めず、手触りを確かめてください。'
  }
  if (t.length > max) {
    const cut = t.lastIndexOf('。', max)
    t = t.slice(0, cut > 0 ? cut + 1 : max)
  }
  return t
}

// 本文生成
function fortuneText(name: string, blood: string, birthday: string){
  const who = name || 'あなた'
  const season = seasonOf(birthday)
  const wday = weekdayOf(birthday)
  const wg = weekdayGroup(wday)
  const seasonLine = season==='春' ? '始動期。小さな着手が大きな波及を生みます'
    : season==='夏' ? '拡張期。視野を広げた投資が実を結びます'
    : season==='秋' ? '収穫期。積み重ねを収めて次に備える好機です'
    : season==='冬' ? '整備期。基礎を整えるほど次の芽が育ちます'
    : '安定期。無理のない歩幅で整えていけます'
  const bloodLine = blood==='A' ? '丁寧さと継続力が静かに運を押し上げます'
    : blood==='B' ? '軽やかな好奇心が扉を開きます'
    : blood==='O' ? '腹の据わった決断が追い風を呼びます'
    : blood==='AB'? '二面性を活かす柔軟さが突破口になります'
    : '素のペースが流れを整えます'

  const p1 = `${who}の今期は「${seasonLine}」。${bloodLine}。既存の関係や習慣を磨くほど、静かな上昇気流に乗れます。`
  const p2 = `${wday}は「${wg.key}」の色が濃い日（${wg.tip}）。体調・睡眠・情報のノイズを整え、点検→改善→共有の短いサイクルを回すと、必要な縁が自然に重なります。`
  return toRange2para(p1, p2)
}

function personalityText(name: string, gender: string, birthday: string){
  const who = name || 'あなた'
  const wday = weekdayOf(birthday)
  const wg = weekdayGroup(wday)
  const view = gender?.toLowerCase()==='male' ? '俯瞰視点と胆力'
    : gender?.toLowerCase()==='female' ? '感受性と調整力'
    : '観察力と機動力'
  const examplePlan = wg.key==='集中' ? '午前=深い作業、午後=レビュー' : '午前=情報収集、午後=検証・共有'
  const p1 = `${who}は、事実と感情の距離感を保ちながら最適解を探るタイプ。${view}が同居し、状況が揺れても拠り所を失いません。課題を小さく切るほど集中が続きます。`
  const p2 = `${wday}は「${wg.key}」のリズム。午前/午後で役割を分け（例：${examplePlan}）、抱え込みを避けるため“頼る相手”を先に決めておくと安定します。`
  return toRange2para(p1, p2)
}

function ngLine(preference: string, wgKey: string){
  const base = wgKey==='集中' ? '即レスや頻繁な割り込みは避け、合間に要点だけ共有を。'
    : wgKey==='交渉' ? '勝ち負けを決める口調や誘導質問はNG、合意形成の前提を揃えて。'
    : wgKey==='整備' ? '細かな指摘の連投や修正依頼の押し付けは避け、合意済みのルールに沿って。'
    : wgKey==='交流' ? '相手の話を奪う独演や感情の押し付けはNG、質問→要約→一言の順で。'
    : '重い議題や詰問は避け、休息と肯定の返答を。'
  const pref2 = preference && preference!=='Unset' ? `（特に${preference}に対して）` : ''
  return `NG相性/避けたいコミュニケーション${pref2}：${base}`
}

function partnerText(name: string, preference: string, birthday: string){
  const who = name || 'あなた'
  const season = seasonOf(birthday)
  const wday = weekdayOf(birthday)
  const wg = weekdayGroup(wday)
  const pref = preference && preference!=='Unset' ? preference : '価値観の相性'
  const seasonHint = season==='春' ? '始動を支え合う'
    : season==='夏' ? '拡張を楽しむ'
    : season==='秋' ? '収穫を分かち合う'
    : season==='冬' ? '整備を一緒に進める'
    : '安定を整える'
  const p1 = `${who}に合うのは、結論を急がずプロセスを一緒に味わえる人。言葉より行動で安心を示し、境界線を尊重しながら世界を少し広げてくれる相手です。`
  const ng = ngLine(preference, wg.key)
  const p2 = `今期は「${seasonHint}」関係が育ちやすい時期。${pref}を大切にしつつ、週1の共有タイムや小旅行など“続く儀式”を持つほど、違いは対立でなく追加の視点となり、関係は静かに強まります。${ng}`
  return toRange2para(p1, p2)
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url)
    const diag = url.searchParams.get('diag') === '1'
    const bodyRaw = await req.json().catch(() => ({})) as Record<string, unknown>
    const name = typeof bodyRaw.name === 'string' ? bodyRaw.name : ''
    const blood = typeof bodyRaw.blood === 'string' ? bodyRaw.blood : ''
    const gender = typeof bodyRaw.gender === 'string' ? bodyRaw.gender : ''
    const preference = typeof bodyRaw.preference === 'string' ? bodyRaw.preference : ''
    const birthday = typeof bodyRaw.birthday === 'string' ? bodyRaw.birthday : ''

    const fortune = fortuneText(name, blood, birthday)
    const personality = personalityText(name, gender, birthday)
    const ideal_partner = partnerText(name, preference, birthday)

    const meta = diag ? {
      fortuneLen: fortune.length,
      personalityLen: personality.length,
      partnerLen: ideal_partner.length,
      season: seasonOf(birthday),
      weekday: weekdayOf(birthday),
      weekdayGroup: weekdayGroup(weekdayOf(birthday)).key,
      ng: ngLine(preference, weekdayGroup(weekdayOf(birthday)).key),
    } : undefined

    return NextResponse.json({ ok: true, fortune, personality, ideal_partner, meta }, { status: 200 })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'unknown_error'
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
