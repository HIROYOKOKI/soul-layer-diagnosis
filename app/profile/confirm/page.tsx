// app/profile/confirm/page.tsx
import Link from "next/link";

type SP = {
  name?: string;
  birthday?: string;
  blood?: string;
  gender?: string;
  preference?: string;
};

// 事前レンダリング時の揺れを避ける
export const dynamic = "force-dynamic";

export default function ProfileConfirm({
  searchParams,
}: {
  searchParams: SP;
}) {
  const name = (searchParams.name ?? "") as string;
  const birthday = (searchParams.birthday ?? "") as string;
  const blood = (searchParams.blood ?? "") as string;
  const gender = (searchParams.gender ?? "") as string;
  const preference = (searchParams.preference ?? "") as string;

  return (
    <div
      style={{
        minHeight: "100dvh",
        background: "#000",
        color: "#e6f6ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "min(560px, 92vw)",
          background: "rgba(10,12,20,.7)",
          border: "1px solid rgba(80,150,255,.25)",
          borderRadius: 20,
          padding: 24,
          boxShadow: "0 12px 40px rgba(90,0,160,.35)",
        }}
      >
        <h1
          style={{
            margin: "0 0 16px",
            fontSize: 20,
            letterSpacing: 4,
            textAlign: "center",
          }}
        >
          入力確認
        </h1>

        <dl style={{ margin: 0 }}>
          <Row label="NAME" value={name} />
          <Row label="DATE OF BIRTH" value={birthday} />
          <Row label="BLOOD TYPE" value={blood} />
          <Row label="GENDER" value={gender} />
          <Row label="PREFERENCE" value={preference} />
        </dl>

        <div
          style={{
            display: "flex",
            gap: 12,
            justifyContent: "flex-end",
            marginTop: 16,
          }}
        >
          <Link
            href="/profile"
            style={{
              padding: "12px 18px",
              borderRadius: 9999,
              border: "1px solid rgba(120,160,255,.35)",
              color: "#e6f6ff",
              textDecoration: "none",
            }}
          >
            戻る
          </Link>

          {/* 送信：まずはダミー遷移。保存実装時は /api を叩く形に差し替え */}
          <Link
            href="/(chrome)/mypage"
            style={{
              padding: "12px 18px",
              borderRadius: 9999,
              border: "1px solid rgba(80,150,255,.4)",
              background: "linear-gradient(90deg,#0af,#a0f)",
              color: "#fff",
              textDecoration: "none",
            }}
          >
            送信
          </Link>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "160px 1fr",
        gap: 12,
        padding: "10px 0",
        borderBottom: "1px solid rgba(120,160,255,.15)",
      }}
    >
      <dt style={{ opacity: 0.8 }}>{label}</dt>
      <dd style={{ margin: 0 }}>{value || "—"}</dd>
    </div>
  );
}
