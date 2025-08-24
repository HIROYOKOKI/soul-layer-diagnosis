// app/profile/page.tsx
'use client';

import { useState, type FormEvent, type CSSProperties } from 'react';

export default function ProfilePage() {
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [blood, setBlood] = useState('A');
  const [gender, setGender] = useState('Other');
  const [preference, setPreference] = useState('Unset');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    alert('保存しました！');
  };

  return (
    <div className="profile-page" style={S.wrap}>
      {/* ヘッダーにEVΛƎロゴ */}
      <header style={S.header}>
        <img src="/evae-logo.svg" alt="EVΛƎ" style={S.logoHeader}/>
      </header>

      {/* プロフィールカード */}
      <div className="card" style={S.card}>
        <h1 style={S.title}>PROFILE</h1>

        <form onSubmit={handleSubmit} style={S.form}>
          {/* NAME：1カラム */}
          <div className="row one">
            <div className="col">
              <label style={S.label}>NAME</label>
              <input
                style={S.input}
                value={name}
                onChange={(e)=>setName(e.target.value)}
              />
            </div>
          </div>

          {/* DATE / BLOOD：2カラム（520px以上で横並び） */}
          <div className="row two">
            <div className="col">
              <label style={S.label}>DATE OF BIRTH</label>
              <input
                style={S.input}
                type="date"
                value={birthday}
                onChange={(e)=>setBirthday(e.target.value)}
              />
            </div>
            <div className="col">
              <label style={S.label}>BLOOD TYPE</label>
              <select
                style={S.input}
                value={blood}
                onChange={(e)=>setBlood(e.target.value)}
              >
                <option>A</option>
                <option>B</option>
                <option>O</option>
                <option>AB</option>
              </select>
            </div>
          </div>

          {/* GENDER / PREFERENCE：2カラム */}
          <div className="row two">
            <div className="col">
              <label style={S.label}>GENDER</label>
              <select
                style={S.input}
                value={gender}
                onChange={(e)=>setGender(e.target.value)}
              >
                <option>Male</option>
                <option>Female</option>
                <option>Other</option>
                <option>Secret</option>
              </select>
            </div>
            <div className="col">
              <label style={S.label}>PREFERENCE</label>
              <select
                style={S.input}
                value={preference}
                onChange={(e)=>setPreference(e.target.value)}
              >
                <option>Unset</option>
                <option>Hetero</option>
                <option>Homo</option>
                <option>Bi</option>
                <option>Asexual</option>
              </select>
            </div>
          </div>

          <button type="submit" style={S.button}>SAVE</button>
        </form>
      </div>

      {/* フッター：ロゴ */}
      <footer style={S.footer}>
        <img src="/soul-layer-diagnosis.svg" alt="Soul Layer Diagnosis" style={S.logoFooter}/>
      </footer>

      {/* iOSフォーム対策＋レイアウトCSS */}
      <style jsx global>{`
        input, select, button, textarea {
          font-size: 16px !important;
          line-height: 1.4 !important;
        }
        @supports (-webkit-touch-callout: none) {
          select { font-size: 17px !important; }
        }
        /* グリッド行 */
        .row { display: grid; grid-template-columns: 1fr; row-gap: 12px; }
        .row.two { grid-template-columns: 1fr; column-gap: 16px; }
        .col { display: flex; flex-direction: column; }

        /* 幅520px以上で2カラム化（タブレット/PC） */
        @media (min-width: 520px) {
          .row.two { grid-template-columns: 1fr 1fr; }
        }
        /* スマホ幅でカード左右を少し詰める */
        @media (max-width: 430px) {
          .profile-page .card { padding: 28px 18px !important; }
        }
      `}</style>
    </div>
  );
}

const glow = '0 0 12px rgba(0,180,255,.8), 0 0 24px rgba(150,0,255,.6)';

const S: Record<string, CSSProperties> = {
  wrap: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'radial-gradient(circle at top, #05060a, #000 80%)',
    color: '#fff',
    fontFamily: 'ui-sans-serif, SF Pro Text, Helvetica, Arial',
    overflowX: 'hidden',
  },
  header: {
    padding: '28px 0 12px',
    display: 'flex',
    justifyContent: 'center',
  },
  logoHeader: {
    height: 32,
    filter: 'drop-shadow(0 0 10px rgba(0,180,255,.6))',
  },
  card: {
    width: 'min(520px, 92vw)',          // ← 520px基準に少し広げると2カラムが安定
    padding: '32px 24px',
    borderRadius: 20,
    background: 'rgba(10,12,20,.65)',
    border: '1px solid rgba(80,150,255,.25)',
    boxShadow: glow,
  },
  title: {
    margin: '0 0 24px',
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: '.12em',
    fontWeight: 700,
    color: '#6bf',
    textShadow: glow,
  },
  form: { display: 'grid', gap: 14 },   // ← 16→14でタイトに
  label: {
    fontSize: 12,
    letterSpacing: '.1em',
    marginBottom: 6,                    // ← ご希望どおり
    color: '#6bf',
  },
  input: {
    minHeight: 56,                       // ← ボタンと高さを揃える
    padding: '12px 14px',
    borderRadius: 12,
    border: '1px solid rgba(120,160,255,.3)',
    background: 'rgba(0,0,0,.6)',
    color: '#fff',
    outline: 'none',
    transition: 'all .2s ease',
    fontSize: 16,
    lineHeight: 1.4,
    WebkitTextSizeAdjust: '100%',
    WebkitAppearance: 'none' as any,     // iOSのデフォルト外観を抑える
    appearance: 'none' as any,
  },
  button: {
    marginTop: 12,
    height: 56,
    borderRadius: 9999,
    border: '1px solid rgba(80,150,255,.4)',
    background: 'linear-gradient(90deg,#0af,#a0f)',
    color: '#fff',
    fontWeight: 600,
    cursor: 'pointer',
    boxShadow: glow,
    textTransform: 'uppercase',
  },
  footer: {
    padding: '20px 0 28px',
    display: 'flex',
    justifyContent: 'center',
  },
  logoFooter: {
    height: 22,
    opacity: .9,
    filter: 'drop-shadow(0 0 6px rgba(0,180,255,.4))',
  },
};
