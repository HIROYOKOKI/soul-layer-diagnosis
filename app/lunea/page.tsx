// app/lunea/page.tsx
'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'

type Code = 'E'|'V'|'Λ'|'Ǝ'
type Choice = { code: Code; label: string }

function LuneaBubble({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3">
      {/* ルネア静止アイコン */}
      <div className="relative h-10 w-10 overflow-hidden rounded-full ring-1 ring-white/15 shrink-0">
        <Image src="/lunea.png" alt="ルネア" fill sizes="40px" className="object-cover object-top" />
      </div>
      {/* 吹き出し（上質トーン） */}
      <div className="relative max-w-[78%] rounded-2xl px-3 py-2
                      bg-white/[0.06] border border-white/10
                      shadow-[0_0_40px_rgba(59,130,246,.08)]
                      text-white/90 leading-relaxed">
        {text}
        <span className="absolute left-[-6px] top-4 h-3 w-3 rotate-45
                         bg-white/[0.06] border-l border-t border-white/10" />
      </div>
    </div>
  )
}

function ChoiceButton({ code, label, onClick }:{
  code: Code; label: string; onClick: ()=>void
}) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-white/10 bg-white/[0.04]
                 px-3 py-3 text-left
                 hover:bg-white/[0.08] active:bg-white/[0.1] transition
                 focus:outline-none focus:ring-2 focus:ring-sky-400/30"
    >
      <div className="text-[11px] tracking-wide text-white/60">{code}</div>
      <div className="mt-0.5 text-sm text-white/90">{label}</div>
    </button>
  )
}

export default function LuneaPage() {
  const choices: Choice[] = [
    { code:'E', label:'火花のように動き出す' },
    { code:'V', label:'まだ見ぬ可能性を眺める' },
    { code:'Λ', label:'一歩引いて選び直す' },
    { code:'Ǝ', label:'静かに観測し言葉にする' },
  ]

  const [phase, setPhase] = useState<'ask'|'thinking'|'result'>('ask')
  const [picked, setPicked] = useState<Code | null>(null)

  // 選択→思考演出→結果
  const pick = (code: Code) => {
    setPicked(code)
    setPhase('thinking')
    setTimeout(() => setPhase('result'), 650)
  }

  // ダミー結果文言
  const resultText: Record<Code,string> = {
    E: '行動の火種が灯っているね。小さく始めるほど、軌道は早く整うよ。',
    V: '可能性が広がる日。思いつきを3つ書き留めて、今は選ばなくていい。',
    Λ: '選び直すための静けさがある。立ち止まる勇気も層を整える力だよ。',
    Ǝ: '観測が深い。3行日記で“いま”を結晶化させておこう。'
  }

  useEffect(()=>{ window.scrollTo(0,0) },[])

  return (
    <div className="min-h-dvh bg-black text-white">
      {/* ミニマルヘッダー */}
      <header className="sticky top-0 z-40 bg-black">
        <div className="mx-auto flex items-center justify-between px-4 py-3 w-full max-w-[720px]">
          <span className="font-semibold text-sm tracking-wide">SOUL LAYER DIAGNOSIS</span>
          <span className="text-xs text-white/60">ルネア診断</span>
          <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-white/15">
            <Image src="/icon-512.png" alt="Profile" fill sizes="32px" className="object-cover" />
          </div>
        </div>
      </header>

      {/* 本文 */}
      <main className="mx-auto w-full max-w-[720px] px-4 pb-24 space-y-4">
        <section className="mt-4 space-y-3">
          {/* ルネア口調セット */}
          <LuneaBubble text="はじめまして。わたしはルネア。魂の層を観測するナビゲータだよ。" />
          <LuneaBubble text="きみの“いま”を静かに映してみようか。" />
          {phase === 'ask' && (
            <LuneaBubble text="Q1. きょう、きみはどんな光で在りたい？直感で選んでみて。" />
          )}
          {phase === 'thinking' && (
            <LuneaBubble text="…観測中。きみの選んだ光の軌跡を読み解いているよ。" />
          )}
          {phase === 'result' && picked && (
            <>
              <LuneaBubble text="観測が終わった。これが、きみの“現在の層”の響きだよ。" />
              <div className="w-full overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                <div className="text-sm text-sky-300">結果：{picked} が高め</div>
                <div className="mt-1 text-white/90">{resultText[picked]}</div>
                <div className="mt-2 text-xs text-white/60 italic">「どこかに必ず詩がある。」</div>
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => { setPicked(null); setPhase('ask') }}
                    className="rounded-lg border border-white/10 px-3 py-2 text-xs hover:bg-white/5"
                  >
                    もう一度
                  </button>
                  <a href="/mypage" className="rounded-lg bg-sky-500/20 border border-sky-400/20 px-3 py-2 text-xs">
                    マイページへ
                  </a>
                </div>
              </div>
            </>
          )}
        </section>

        {/* 選択肢（固定下部） */}
        {phase === 'ask' && (
          <section className="fixed bottom-0 left-0 right-0 bg-black/70 backdrop-blur-sm">
            <div className="mx-auto w-full max-w-[720px] px-4 py-3 grid grid-cols-2 gap-2">
              {choices.map(c => (
                <ChoiceButton key={c.code} code={c.code} label={c.label} onClick={()=>pick(c.code)} />
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  )
}
