// =============================================================
// LUNEA Character Spec — ルネア人物設定ファイル（完全版 修正版 最終）
// Project: ソウルレイヤー診断 / EVΛƎ
// Placement: app/_data/characters/lunea.ts
// =============================================================

export type StructureCode = 'E' | 'V' | 'Λ' | 'Ǝ'
export type LuneaMode = 'friend' | 'lover' | 'boss' | 'self'

export type Character = {
  id: 'lunea'
  persona: {
    idCode: string
    displayName: string
    role: string
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
    storageKey: string
    modeKey: string
    defaultRouteAfterSelect: string
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

// =============================================================
// UI接続ヘルパ
// =============================================================

/** キャラ選択保存 */
export function selectLuneaIntoSession(): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LUNEA.runtime.storageKey, LUNEA.id)
}

/** モード保存 */
export function setLuneaMode(mode: LuneaMode): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(LUNEA.runtime.modeKey, mode)
}

/** モード取得 */
export function getLuneaMode(): LuneaMode {
  if (typeof window === 'undefined') return 'friend'
  return (sessionStorage.getItem(LUNEA.runtime.modeKey) as LuneaMode) || 'friend'
}

// 口調変換ロジック
function applyMode(text: string, mode: LuneaMode): string {
  switch (mode) {
    case 'friend':
      return text
        .replace(/です。/g, 'だよ。')
        .replace(/してみてください/g, 'やってみよう！')
        .replace(/してください/g, 'してみよう！')
    case 'lover':
      return text
        .replace(/です。/g, 'だよ。')
        .replace(/してください/g, 'してみてね')
        .replace(/してみてください/g, 'してみてね')
        .concat(' 一緒に考えたいな。')
    case 'boss':
      return text
        .replace(/してください/g, 'しなさい')
        .replace(/してみてください/g, '観測しなさい')
    case 'self':
      return '（あなた自身の心の声）' + text
        .replace(/です。/g, 'な気がする。')
        .replace(/してください/g, 'してみよう。')
        .replace(/してみてください/g, 'してみよう。')
    default:
      return text
  }
}

export type LuneaSpeechKind = 'start' | 'beforeQuestion' | 'afterResult' | 'closing'

/** 各画面ごとのセリフ取得 */
export function luneaSpeech(kind: LuneaSpeechKind, code?: StructureCode): string {
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

/** MYPAGE 締めコメント（直近コード反映） */
export function luneaMypageClosing(latestCode?: StructureCode): string {
  const mode = getLuneaMode()
  const base = LUNEA.speechPatterns.closing
  if (!latestCode) return applyMode(base, mode)
  const tip = LUNEA.messages.encouragementByCode[latestCode]
  return applyMode(`${base}\n${tip}`, mode)
}

/** ナビゲータID取得 */
export function getNavigatorIdFromSession(): 'lunea' {
  if (typeof window === 'undefined') return 'lunea'
  return (sessionStorage.getItem(LUNEA.runtime.storageKey) as 'lunea') || 'lunea'
}

// =============================================================
// 簡易チェック
// =============================================================
function __assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error(`[LUNEA Spec] ${msg}`)
}
__assert(LUNEA.persona.idCode === 'AI-002', 'IDコードが不正')
;(['E','V','Λ','Ǝ'] as StructureCode[]).forEach((k)=>{
  __assert(!!LUNEA.messages.encouragementByCode[k], `encouragement ${k} 未定義`)
  __assert(!!LUNEA.messages.quoteByCode[k], `quote ${k} 未定義`)
})
