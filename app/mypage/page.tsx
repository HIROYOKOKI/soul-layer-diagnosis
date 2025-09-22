// app/mypage/page.tsx
import MyPageClientWrapper from './MyPageClientWrapper';

export default async function MyPagePage() {
  try {
    const res = await fetch('/api/theme', { cache: 'no-store' });
    // API自体が非JSONを返しているときに備えて try/catch
    const json = await res.json().catch((e) => {
      console.error('Failed to parse /api/theme JSON:', e, 'status:', res.status);
      return null;
    });
    const theme = json?.scope ?? null;
    return <MyPageClientWrapper theme={theme} />;
  } catch (err) {
    // サーバ側のエラーを端末のターミナルに出力（Vercelならデプロイログに出る）
    console.error('Error rendering /mypage:', err);
    // フロントには優しいメッセージ（500で真っ赤になるのを防ぐ）
    return (
      <div style={{ padding: 24 }}>
        <h1>/mypage 一時エラー</h1>
        <p>エラーが発生しました。詳細はターミナルのログを確認してください。</p>
      </div>
    );
  }
}
