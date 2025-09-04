// app/legal/[slug]/page.tsx
import type { Metadata } from "next";

const CONTENT: Record<string, { title: string; body: string }> = {
  terms: {
    title: "利用規約",
    body: `
第1条（適用）
本規約は、ソウルレイヤー診断（以下「本サービス」）の利用条件を定めるものです。
…（ドラフト本文をここに）

第2条（禁止事項）
1. 法令または公序良俗に反する行為
2. 本サービスの運営を妨害する行為
…`,
  },
  privacy: {
    title: "プライバシーポリシー",
    body: `
1. 取得する情報
- アカウント情報（メールアドレス等）
- 診断に関する入力・結果データ（匿名化方針を明記）
…（ドラフト本文をここに）

2. 利用目的
- 診断結果の表示・履歴の提供
- 品質改善・不正利用防止
…`,
  },
  compliance: {
    title: "コンプライアンス・特商法",
    body: `
【行動規範
