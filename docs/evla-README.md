# EVΛƎ 熟慮ループ 実装仕様（SSOT）

## 0. 目的
- UIは **コメント／アドバイス／アファ／スコア** のシンプル表示
- 裏では **E/V/Λ/Ǝ/NextV** を JSON で完全保存（特許・学習・可視化用）
- **緊急モード（EΛVƎ）は未実装**（特許には含める）

## 1. ディレクトリ & ファイル
- `/lib/types.ts` … 型定義（固定API契約）
- `/lib/evla.ts` … ループ共通ロジック（関数群）
- `/api/daily/question/route.ts` … 質問生成（seed付き多様化）
- `/api/daily/answer/route.ts` … E→V→Λ→Ǝ→NextV + 保存 + UI整形
- `/app/daily/page.tsx` … 画面（質問→選択→結果カード）
- `/docs/evla-README.md` … 本ドキュメント（SSOT）

## 2. DB 契約（Supabase）
```sql
ALTER TABLE daily_results ADD COLUMN IF NOT EXISTS evla JSONB;
-- 既存の score, slot, user_id, theme は流用
