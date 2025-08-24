// app/profile/confirm/page.tsx
'use client';

import { useSearchParams, useRouter } from 'next/navigation';

export default function ProfileConfirm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const name = searchParams.get('name') || '';
  const birthday = searchParams.get('birthday') || '';
  const blood = searchParams.get('blood') || '';
  const gender = searchParams.get('gender') || '';
  const preference = searchParams.get('preference') || '';

  const handleBack = () => {
    router.back(); // 前の入力ページに戻る
  };

  const handleSubmit = () => {
    alert('送信しました！');
    // 本来はここで Supabase 保存処理などを呼び出す
  };

  return (
    <div style={{minHeight:'100vh', background:'#000', color:'#fff', padding:'32px'}}>
      <h1>入力確認</h1>
      <ul style={{lineHeight:1.8}}>
        <li>NAME: {name}</li>
        <li>DATE OF BIRTH: {birthday}</li>
        <li>BLOOD TYPE: {blood}</li>
        <li>GENDER: {gender}</li>
        <li>PREFERENCE: {preference}</li>
      </ul>

      <div style={{marginTop:24, display:'flex', gap:16}}>
        <button onClick={handleBack} style={{padding:'12px 20px', borderRadius:8}}>戻る</button>
        <button onClick={handleSubmit} style={{padding:'12px 20px', borderRadius:8, background:'linear-gradient(90deg,#0af,#a0f)', color:'#fff'}}>送信</button>
      </div>
    </div>
  );
}
