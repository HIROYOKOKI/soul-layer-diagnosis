'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function LoginCallbackBridge() {
  const sp = useSearchParams();
  const router = useRouter();
  const supabase = createClientComponentClient();
  const [done, setDone] = useState(false);

  useEffect(() => {
    (async () => {
      if (done) return;
      const code = sp.get('code');
      const type = (sp.get('type') || '').toLowerCase(); // signup, magiclink, recovery...
      const token_hash = sp.get('token_hash');
      const token = sp.get('token');
      const next = sp.get('next') || '/welcome';

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          setDone(true);
          router.replace(next);
          return;
        }
        if (token_hash || token) {
          const verifyType =
            ['signup', 'magiclink', 'recovery', 'invite', 'email_change'].includes(type)
              ? (type as any)
              : ('signup' as const);
          const { error } = await supabase.auth.verifyOtp({
            type: verifyType,
            token_hash: token_hash ?? undefined,
            token: token ?? undefined,
          } as any);
          if (error) throw error;
          setDone(true);
          router.replace(next);
          return;
        }
      } catch (e) {
        // 失敗時は通常のログインUIをそのまま表示
        console.error('[login-bridge]', e);
      }
    })();
  }, [done, router, sp, supabase]);

  return null;
}
