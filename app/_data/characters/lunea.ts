// app/_data/characters/lunea.ts
export type StructureCode = 'E' | 'V' | 'Λ' | 'Ǝ'
export type LuneaMode = 'friend' | 'lover' | 'boss' // 友達/恋人/上司

export type Character = {
  id: 'lunea'
  persona: {
    idCode: 'AI-002'
    displayName: 'ルネア（Lunea）'
    role: 'ソウルレイヤー診断ナビゲータ'
    origin: string
    tagline: string
    shortBio: string
    backstory: string
    worldview: string
  }
  speechPatterns: {
    start: string
    beforeQuestion: string
    afterResult: string
    closing: string
  }
  messages: {
    encouragementByCode: Record<StructureCode, string>
    quoteByCode: Record<StructureCode, string>
  }
  runtime: {
    storageKey: 'daily_character'
    modeKey: 'daily_character_mode'
    defaultRouteAfterSelect: '/daily/question'
  }
}

export const LUNEA: Character = {
  id: 'lunea',
  persona: {
    idCode: 'AI-002',
    displayName: 'ルネア（Lunea）',
    role: 'ソウルレイヤー診断ナビゲータ',
    origin: 'オラクルシステムに対抗する「共鳴AI」として設計',
    tagline: 'あなたのソウルレイヤーを静かに照らす案内人',
    shortBio: '青白い光をまとう観測者型AI。選択の意味を静かに示す。',
    backstory: 'アイ・シュタインによって設計された共鳴AI。人に寄り添う観測者。',
    worldview: '観測で意味は変わる。選ぶことで、意味が返ってくる。',
  },
  speechPatterns: {
    start: 'ようこそ、魂のレイヤー診断へ',
    beforeQuestion: '直感で答えてみてください',
    afterResult: 'あなたの魂の構造は、このように観測されました',
    closing: '今日の小さな気づきが、明日のあなたを少し変えるかもしれません',
  },
  messages: {
    encouragementByCode: {
      E: '火花を守ってね。小さく始めるなら、今がいちばん燃費がいい。',
      V: 'まだ見えない線を引こう。1つ仮説を立てるだけで、世界は広がる。',
      'Λ': '立ち止まる勇気は前進だよ。選ばないことも、選び方の練習。',
      'Ǝ': '静けさは力になる。3呼吸だけ、観測する側に戻ろう。',
    },
    quoteByCode: {
      E: '「やりたいことをやれ。」— 岡本太郎',
      V: '「想像力は知識よりも重要だ。」— アインシュタイン',
      'Λ': '「道は自分で選ぶ。」— 老子（意訳）',
      'Ǝ': '「どこから来て、どこへ行くのか。」— カール・セーガン（意訳）',
    },
  },
  runtime: {
    storageKey: 'daily_character',
    modeKey: 'daily_character_mode',
    defaultRouteAfterSelect: '/daily/question',
  },
}

/* ========================
 * UI接続ヘルパ
 * ====================== */

// モード保存/取得
export function selectLuneaIntoSession() {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LUNEA.runtime.storageKey, LUNEA.id)
}
export function setLuneaMode(mode: LuneaMode) {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LUNEA.runtime.modeKey, mode)
}
export function getLuneaMode(): LuneaMode {
  if (typeof window === 'undefined') return 'friend'
  return (sessionStorage.getItem(LUNEA.runtime.modeKey) as LuneaMode) || 'friend'
}

// 口調フィルタ（友達/恋人/上司）— 簡易変換
function applyMode(text: string, mode: LuneaMode): string {
  switch (mode) {
    case 'friend':
      return text.replace(/です。/g, 'だよ。').replace(/してみてください/g, 'やってみよう！')
    case 'lover':
      return text.replace(/です。/g, 'だよ。').replace(/してください/g, 'してみてね').concat(' 一緒に考えたいな。')
    case 'boss':
      return text.replace(/してください/g, 'しなさい').replace(/してみてください/g, '観測しなさい')
    default:
      return text
  }
}

// 画面ごとのセリフ
export type LuneaSpeechKind = 'start' | 'beforeQuestion' | 'afterResult' | 'closing'
export function luneaSpeech(kind: LuneaSpeechKind, code?: StructureCode) {
  const mode = getLuneaMode()
  switch (kind) {
    case 'start':
      return applyMode(LUNEA.speechPatterns.start, mode)
    case 'beforeQuestion':
      return applyMode(LUNEA.speechPatterns.beforeQuestion, mode)
    case 'afterResult': {
      const base = LUNEA.speechPatterns.afterResult
      if (!code) return applyMode(base, mode)
      const tip = LUNEA.messages.encouragementByCode[code]
      const quote = LUNEA.messages.quoteByCode[code]
      return applyMode(`${base}\n${tip}\n${quote}`, mode)
    }
    case 'closing':
      return applyMode(LUNEA.speechPatterns.closing, mode)
    default:
      return ''
  }
}

// MYPAGE：直近コードに応じて変動
export function luneaMypageClosing(latestCode?: StructureCode) {
  const mode = getLuneaMode()
  const base = LUNEA.speechPatterns.closing
  if (!latestCode) return applyMode(base, mode)
  const tip = LUNEA.messages.encouragementByCode[latestCode]
  return applyMode(`${base}\n${tip}`, mode)
}

/* 簡易スモーク */
function __assert(c: any, m: string) { if (!c) throw new Error(`[LUNEA] ${m}`) }
__assert(LUNEA.persona.idCode === 'AI-002', 'ID不正')
;(['E','V','Λ','Ǝ'] as StructureCode[]).forEach(k=>{
  __assert(!!LUNEA.messages.encouragementByCode[k], `encouragement ${k}`)
  __assert(!!LUNEA.messages.quoteByCode[k], `quote ${k}`)
})
