'use client';

import { useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginEmailPage() {
  const router = useRouter();
  const search = typeof window !== 'undefined' ? window.location.search : '';
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const [email, setEmail] = useState(() => params.get('email') ?? '');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);   // 👈 表示/非表示フラグ
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const { error } = await sb.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) throw error;
      router.push('/mypage');
    } catch (e: any) {
      setErr(humanize(e?.message ?? 'ログインに失敗しました'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-sm p-6">
      <div className="mb-6 flex items-center gap-2">
        <Image src="/evae-logo.svg" alt="EVΛƎ" width={96} height={24} priority />
        <h1 className="text-lg font-bold">ログイン</h1>
      </div>

      <form onSubmit={onSubmit} className="grid gap-3">
        <label className="grid gap-1 text-sm">
          <span>Email</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="rounded border border-white/20 bg-black/30 p-2"
            autoComplete="email"
          />
        </label>

       <div className="relative flex items-center">
  <input
    type={showPw ? 'text' : 'password'}
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    required
    className="w-full rounded border border-white/20 bg-black/30 p-2 pr-10"
  />
  <button
    type="button"
    onClick={() => setShowPw(v => !v)}
    className="absolute right-2 text-2xl leading-none"
    aria-label={showPw ? 'パスワードを隠す' : 'パスワードを表示'}
  >
    {showPw ? '🙈' : '👁️'}
  </button>
</div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 rounded bg-white/10 px-4 py-2 font-semibold hover:bg-white/20 disabled:opacity-50"
        >
          {loading ? 'Signing in…' : 'ログイン'}
        </button>

        {err && <p className="text-sm text-red-400">{err}</p>}
      </form>

      <p className="mt-3 text-sm opacity-70">
        はじめての方は{' '}
        <a href="/signup" className="underline text-sky-300">
          新規登録
        </a>
      </p>
    </div>
  );
}

function humanize(msg: string) {
  if (/Invalid login credentials/i.test(msg)) return 'メールまたはパスワードが違います';
  if (/Email not confirmed/i.test(msg)) return 'メール確認が未完了です。受信箱をご確認ください';
  if (/too many requests/i.test(msg)) return '試行回数が多すぎます。少し待ってから再度お試しください';
  return msg;
}
