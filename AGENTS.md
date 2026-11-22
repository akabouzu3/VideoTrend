# VideoTrend 開発ルール

プロダクトの仕様、採用技術、実データ版の構成は [README.md](README.md) を参照する。

## 実装

- 現行の静的試作は `dist/` にある。Next.js版では App Router、TypeScript、Tailwind CSS、Drizzle ORM を使う。
- 変更する前に既存のコンポーネントや関数を確認し、使えるものを再利用する。依頼の範囲に変更を絞る。
- ボタン、入力欄、ダイアログは標準HTMLを基本とし、キーボードで操作できるようにする。複雑な矢印キー操作やフォーカス管理が必要な場合は、該当する部品に Radix UI を使う。共通コンポーネントにまとめ、導入理由を変更内容に記す。
- X APIの呼び出しと認証情報はサーバー側に置く。ランキング画面は定期ジョブで集計済みのデータを使う。更新に失敗した場合は、前回の正常なランキングを保持する。

## 変更後の確認

- 静的試作のJavaScriptを変更したら `node --check dist/app.js` を実行する。画面を変更したら、READMEの手順で起動し、変更に関係する操作をブラウザで確認する。
- Next.js版を変更したら `npm run lint`、`npm run typecheck`、`npm run build` のうち、変更に関係する確認を実行する。GitHub ActionsとPlaywrightの導入手順はREADMEのセクション3を参照する。
- 画面の確認では、期間切り替え、ジャンル・キーワードでの絞り込み、保存した動画が再読み込み後も表示されることを優先する。
- 作業結果には、実行した確認と結果を記す。確認できなかった項目があれば理由も記す。

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
