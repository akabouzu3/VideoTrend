# VideoTrend

**Xでいま話題の動画を、ひと目で。**

VideoTrendは、X（旧Twitter）で注目を集めている動画を、期間別のランキングから見つけられるサイトです。タイムラインをさかのぼる時間がないときも、今日話題になった動画や、今週見逃した動画をまとめてチェックできます。

ついびでおの期間別ランキングから着想を得ています。VideoTrendでは、見たいジャンルで絞り込んだあと、Xの元投稿で動画や反応まで見られる体験を目指します。

## 動画の探し方

- **期間で見る** — 24時間・3日間・1週間を切り替えて、話題の動画を一覧で確認する。
- **興味で絞る** — 動物、グルメ、スポーツなどのジャンルやキーワードから探す。
- **あとで見る** — 気になった動画をブラウザに保存し、あとで見返す。

## 現在の試作

[`dist/`](dist/) に、HTML・CSS・JavaScriptで作った静的サイトがあります。サンプルのランキングで期間切り替え、絞り込み、保存を試せます。カードの詳細から関連動画のX検索を開けます。

ローカルではリポジトリのルートで次のコマンドを実行し、[http://localhost:8000](http://localhost:8000) を開きます。

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

### Next.js版の開発環境

Next.js版のコードは [`app/`](app/) にあります。サンプルデータで期間別ランキング、ジャンル・キーワード絞り込み、「あとで見る」、動画詳細を試せます。

nvmを使う場合は、リポジトリのルートから次のコマンドを実行します。`nvm install` と `nvm use` は [`.nvmrc`](.nvmrc) を参照します。nvmを使わない場合は、Node.js 24系を用意して `npm ci` から実行します。起動後は [http://localhost:3000](http://localhost:3000) を開きます。

```sh
nvm install
nvm use
npm ci
npm run dev
```

ローカルとGitHub Actionsは `.nvmrc`、Vercelは `package.json` の `engines.node` でNode.js 24系を指定します。

### X APIなしで手選び動画を試す

開発サーバーの [http://localhost:3000/manual](http://localhost:3000/manual) で、手作業で選んだXの動画付き投稿を試せます。一覧の動画部分にはサムネイルが表示されます。サムネイルを押すと再生画面が開きます。Xの埋め込みはプレーヤーの再生ボタンで開始し、「Xで再生」と表示する動画は元投稿で視聴できます。再生画面の「前の動画」「次の動画」ボタン、またはその周辺の横スワイプで、絞り込み後の一覧順に移動できます。X APIキーやデータベースは不要です。[Xの埋め込みについて](https://help.x.com/ja/using-x/how-to-embed-a-post)

一覧は投稿日が新しい順で、既定は全期間です。24時間・3日間・1週間は、一覧の最新投稿日を基準に絞り込みます。トップページも手選び版にする場合は、`.env.local` を `RANKING_SOURCE=manual` にして開発サーバーを再起動します。

動画の追加や差し替えは [`app/manual-posts.ts`](app/manual-posts.ts) で行います。Xの元投稿URLからアカウント名と投稿IDを記入し、実際の投稿日、ジャンル、紹介文、サムネイルURLを登録します。再生方法は埋め込みが再生できる投稿を `embed`、X上での再生が必要な投稿を `x` とします。

サイト内で再生できる動画ファイルを用意できる場合は、`playback: "file"` と `videoUrl` を指定します。この場合はサムネイルを押すと消音で再生が始まり、プレーヤーで音声をオンにできます。

### 自動チェック

依存をインストールしたら、CIと同じ順で確認できます。Playwrightは本番ビルドをポート3100で起動し、ChromiumのPC向けとスマホ向けの設定でテストします。

```sh
npx playwright install chromium
npm run lint
npm run typecheck
npm run build
npm run test:e2e
```

GitHub Actionsの [CI](.github/workflows/ci.yml) はPRと `main`・`develop` へのpushで実行します。ブランチ保護の必須チェックにする場合は、テスト用PRで一度成功させてから **Lint, typecheck, build and E2E** を選びます。依存の更新候補は [Dependabot](.github/dependabot.yml) が週次で確認します。

CIではPostgreSQL 17にマイグレーションを適用し、模擬X APIで更新処理も検証します。ローカルで同じテストを行う場合は、下記の専用DBの手順を使用します。

### Vercel Hobbyでプレビューする

Vercelの **Add New → Project** からGitHubの `akabouzu3/VideoTrend` をインポートし、個人のHobbyチームを選びます。本番ブランチは `main` に設定すると、`develop` や作業ブランチへのpushからプレビューを確認できます。インストールとビルドは [`vercel.json`](vercel.json) を参照します。サンプル版の動作に環境変数は不要です。[VercelのGitHub連携](https://vercel.com/docs/git/vercel-for-github)、[プレビュー対象のブランチ](https://vercel.com/docs/git#preview-branches)

## 実データ版の構成

```text
X API → 定期ジョブ → PostgreSQL → Next.js → ブラウザ → Xの元投稿
```

1. 定期ジョブがX APIで日本語の動画付き公開投稿を1ページ取得し、前回掲載した投稿を一括で再確認します。投稿IDで重複を除き、センシティブ指定や閲覧制限のある候補を除外します。
2. 24時間以内、24時間超〜3日以内、3日超〜1週間以内の枠ごとに上位候補を保持します。3つの表示期間は、最新の集計時刻を基準に重ねて計算します。更新が失敗した場合も前回の集計と時刻を保持し、削除・非公開を確認できた投稿は取り下げます。同時実行はPostgreSQLのロックで防ぎます。
3. Next.jsは集計の更新ごとにキャッシュキーを切り替えます。ランキング閲覧とキーワード検索はPostgreSQLのデータを使い、X APIは呼び出しません。検索用に保持する本文はサーバー側に置き、公開画面には含めません。
4. カードからXの元投稿を開けます。掲載期間外の保存済み投稿はブラウザからリンクを開けます。取り下げ依頼を受けた投稿は運用者が再掲載も停止できます。

### ランキングの決め方

実データ版では、取得した候補の**いいね・リポスト・返信・引用の合計**で順位付けします。動画の再生数は初回の検証で取得率を測り、表示回数と区別します。画面には対象期間、集計指標、更新時刻を表示します。[X APIの指標](https://docs.x.com/x-api/fundamentals/metrics)

### DockerでローカルDBを用意する

Docker ComposeでPostgreSQLを起動します。Next.jsはホスト側で動かします。PostgreSQLの既定は17系です。Supabaseに接続する段階でメジャーバージョンを確認し、必要に応じて新しいローカルDBの起動時に `POSTGRES_MAJOR` を指定します。

```sh
test -f .env.local || cp .env.example .env.local
docker compose up -d --wait postgres
npm run db:migrate
```

通常の画面開発は `RANKING_SOURCE=sample` のまま進められます。以下は模擬データと専用DBを使う統合テストです。初回だけ専用DBを作成します。

```sh
docker compose exec -T postgres createdb -U videotrend videotrend_test
test_db=postgresql://videotrend:videotrend@127.0.0.1:54320/videotrend_test
DATABASE_MIGRATION_URL="$test_db" npm run db:migrate
TEST_DATABASE_URL="$test_db" npm run test:data
```

テスト後のデータで実データ用画面を確認するには、`RANKING_SOURCE=x DATABASE_URL="$test_db" npm run dev` を使います。

### X APIを少量で検証する

X Developer Consoleで用途、読み取り権限、単価とクレジット残高を確認し、支出上限を設定します。Bearer Tokenは `.env.local` の `X_BEARER_TOKEN` に設定します。次のコマンドは検索を1回実行し、取得投稿数、動画付き件数、動画の再生数が取得できた件数を表示します。実際の課金件数と金額はDeveloper Consoleで確認します。[X API料金](https://docs.x.com/x-api/getting-started/pricing)

```sh
npm run x:probe -- --confirm-paid 10
```

定期ジョブの既定は1回あたり検索20件と再確認最大30件です。投稿読み取りの例では、1日1回を30日間実行して最大1,500件、1件0.005米ドルなら月7.50米ドルです。追加の読み取り料金、手動再実行、実際の課金単位は別に確認します。

### SupabaseとVercelで実データ版を運用する

1. SupabaseにPostgreSQLを用意し、マイグレーション用の接続先を `DATABASE_MIGRATION_URL` に設定して `npm run db:migrate` を実行します。アプリの `DATABASE_URL` にはサーバーレス向けのトランザクションプーラーを使います。マイグレーションには直接接続かセッションプーラーを使います。テーブルは専用スキーマ `videotrend` に作成されます。[Supabaseの接続方法](https://supabase.com/docs/guides/database/connecting-to-postgres)
2. VercelのProduction環境に `RANKING_SOURCE=x`、`DATABASE_URL`、`X_BEARER_TOKEN`、`CRON_SECRET` を設定します。`CRON_SECRET` は16文字以上のランダムな値にします。Previewは既定のサンプルモードで動作します。掲載の連絡先は `CONTACT_EMAIL` で設定できます。
3. [`vercel.json`](vercel.json) の定期ジョブは1日1回、10時台（日本時間）に実行します。Vercel Cronの実行ログでHTTP応答と結果を確認します。手動実行時もAPIを読み取るため、初回や復旧時に実行する前に残り予算を確認します。[Vercel Cronの認証と再試行](https://vercel.com/docs/schedules/cron-jobs/manage-cron-jobs)
4. Sentryを利用する場合は `SENTRY_DSN` と、ブラウザのエラー用に `NEXT_PUBLIC_SENTRY_DSN` を設定し、Sentryで通知先を登録します。更新失敗はVercelログにも出力されます。画面には最後に成功した集計時刻が表示されます。

手動更新と取り下げは、運用者が対象環境のURLと `CRON_SECRET` を設定して実行します。取り下げは投稿IDを抑止リストに保存し、将来の定期更新からも除外します。

```sh
curl --fail-with-body -H "Authorization: Bearer $CRON_SECRET" "$SITE_URL/api/cron/rankings"
curl --fail-with-body -X POST -H "Authorization: Bearer $CRON_SECRET" \
  "$SITE_URL/api/admin/suppress-post?id=$POST_ID"
```

## 採用技術

以下はNext.js版で採用を予定している技術です。

| 用途 | 技術 | 採用理由 |
| --- | --- | --- |
| Webアプリ | Next.js App Router・TypeScript・Node.js | 期間やジャンルごとのURL、検索向けのHTML、SNS共有用メタデータを管理しやすい。画面と集計処理で投稿やランキングの型を共有できる。 |
| UI | Tailwind CSS | カードやフィルターのスタイルをReactコンポーネント内で管理しやすい。試作の配色・余白をテーマに取り込み、画面幅ごとのレイアウトやフォーカス時の見た目を揃えられる。 |
| ブラウザ保存 | `localStorage` | 初期版の「あとで見る」をログインなしで使える。 |
| ホスティング | Vercel | Next.jsのデプロイ、PRプレビュー、定期実行をまとめて運用できる。個人の非商用試作はHobby、商用公開前にProへ切り替える。[Vercel Hobby](https://vercel.com/docs/plans/hobby) |
| データベース | Supabase PostgreSQL・Drizzle ORM | 投稿、指標、ランキングをSQLで扱い、スキーマ変更をマイグレーションで管理できる。検証はFreeで始め、商用公開時にバックアップや稼働要件に応じてProを検討する。[Supabase料金](https://supabase.com/pricing) |
| 定期取得 | Vercel Cron | 小規模な取得・集計をWebと同じプロジェクトで運用できる。プランごとの実行頻度や実行時間の制限を踏まえて更新間隔を決める。[Vercel Cron](https://vercel.com/docs/schedules/cron-jobs/manage-cron-jobs) |
| テスト・監視 | GitHub Actions・Playwright・Sentry | 期間切り替え、絞り込み、保存などの主要操作をCIで確認し、公開後は画面のエラーと更新ジョブの失敗を追えるようにする。 |

まずはVercelとSupabaseで運用箇所を絞ります。Vercel Cronは呼び出しの失敗を自動で再試行しないため、初期版は失敗を通知し、次の定期実行か手動実行で更新を再開します。既存のAWS運用基盤を活用できる場合や、スケジュールからの配送失敗を再試行・退避する必要が生じた場合は、取得部分にEventBridge SchedulerとLambdaを使う構成を検討します。[Vercel Cron](https://vercel.com/docs/schedules/cron-jobs/manage-cron-jobs)、[EventBridge Schedulerの失敗処理](https://docs.aws.amazon.com/scheduler/latest/UserGuide/managing-schedule.html)

## 実装手順

各セクションの完了条件を確認してから次に進みます。

サンプル版、自動チェック、実データ取得・集計・配信、商用公開用の設定を実装しています。外部環境ではGitHub ActionsとVercelプレビューの確認、X APIの有償検証、Supabaseへの接続、試験運用と公開判断を行います。

| セクション | 作業 | 完了条件 |
| --- | --- | --- |
| 1. Next.jsの土台 | App Router、TypeScript、Tailwind CSSをセットアップする。開発・lint・型チェック・ビルドのコマンドを用意する。 | ローカルでトップページが開き、lint・型チェック・本番ビルドが通る。 |
| 2. サンプル版の移植 | 現行の見た目とサンプルを移し、24時間・3日間・1週間、ジャンル・キーワード絞り込み、保存、動画詳細を実装する。 | スマホとPCで主要操作ができ、同じサイトで再読み込みしても保存内容が残る。 |
| 3. 自動チェックと非商用プレビュー | Playwrightで主要操作を自動化し、GitHub Actionsでlint・型チェック・ビルドとあわせて実行する。Dependabotで依存更新を週次チェックする。Vercel Hobbyでサンプル版を確認する。 | CIが通り、プレビューでサンプル版を操作できる。 |
| 4. X APIの少量検証 | 予算内で日本語の動画付き投稿を取得し、候補件数、取得可能な指標、課金件数、投稿・画像の表示条件を確認する。 | 取得結果と費用の試算を記録し、ランキングに使う指標と初期の更新頻度を決める。[X API料金](https://docs.x.com/x-api/getting-started/pricing)、[X開発者ポリシー](https://docs.x.com/developer-terms/policy) |
| 5. 実データの定期更新 | Supabase PostgreSQLとDrizzleを導入し、投稿と集計結果を保存する。Vercel Cronで更新し、失敗通知と削除・非公開投稿の取り下げを実装する。 | 実データを配信でき、再実行で重複しない。更新に失敗したときは前回の正常なランキングが表示され、取り下げがキャッシュにも反映される。 |
| 6. 商用公開 | 試験運用の結果と月額を確認し、商用公開前にVercelをProへ変更する。DBのプランはバックアップと稼働要件で決める。 | 定期更新が安定し、費用の見通しと投稿の表示ルールを確認したうえで公開できる。広告や有料機能の検証は公開後に進める。[Vercelの利用規約](https://vercel.com/legal/terms)、[X開発者ポリシー](https://docs.x.com/developer-terms/policy) |

### 商用公開前の確認

- [ ] GitHub上でCIが成功し、VercelプレビューでPC・スマホの操作を確認した。
- [ ] X APIの取得件数・指標・請求額を確認し、予算内の更新頻度を決めた。
- [ ] Supabaseでマイグレーションとバックアップ方針を確認し、取り下げが公開画面に反映されることを確認した。
- [ ] 2週間の試験運用で更新成功率・費用・エラー通知を確認した。
- [ ] VercelをProに切り替え、掲載連絡先を設定し、投稿の表示方法をXの規約で確認した。

## 月々の運用費

2026年11月時点の料金を基にした概算です。X APIの例は、月3,000件の**課金対象となる投稿の読み取り**を1件0.005米ドルで計算しています。

| 運用段階 | Vercel | Supabase | X APIの例 | 月額の目安 |
| --- | ---: | ---: | ---: | ---: |
| 非商用・サンプルデータ | Hobby $0 | Free $0 | $0 | **$0** |
| 非商用・実データ検証 | Hobby $0 | Free $0 | $15 | **$15** |
| 商用・小規模公開 | Pro $20 | Free $0 | $15 | **$35** |
| 商用・DBもPro | Pro $20 | Pro $25 | $15 | **$60** |

表は1人での運用を想定しています。税、ドメイン代、各サービスの超過料金、投稿読み取り以外のAPI費用は別途見積もります。初回の実データ検証ではAPI予算を月15米ドルと仮置きし、実際の請求額と取得できた投稿数を見て更新頻度を決めます。同じ投稿の読み取りが日をまたいで課金されることもあるため、保存した投稿数と課金件数は分けて計測します。[Vercel料金](https://vercel.com/pricing)、[Supabase料金](https://supabase.com/pricing)、[X API料金](https://docs.x.com/x-api/getting-started/pricing)

## 今後の目標

次の数値は初期の目安です。実データで得られる投稿数や公開後の利用状況を見て見直します。

| 段階 | 達成の目安 |
| --- | --- |
| 試作を完成させる | Next.js版で3つの期間、ジャンル・キーワード絞り込み、「あとで見る」をスマホとPCで使える状態にする。 |
| 実データ版を安定させる | 2週間の試験運用で定期更新の成功率95%以上を目指す。更新失敗の通知と、削除・非公開になった投稿の取り下げも確認する。 |
| 公開後に使われ方を測る | まず月間1,000訪問を目安に、期間・ジャンル別の閲覧数、元投稿への遷移率、再訪の傾向を測る。利用が多い期間やジャンルから検索・SNS向けのページを整える。 |

## 収益化の目標

ランキングは無料で公開し、商用公開後に広告を小規模に試します。ジャンル別ページに継続した閲覧が集まれば、サイト上で広告であることを明示したスポンサー枠も検討します。掲載前にXの投稿と広告の区別や配置を規約に照らして確認します。[X開発者ポリシー](https://docs.x.com/developer-terms/policy)

1. **運用費を回収する。** 月間売上から決済・配信手数料などを差し引いた収益で、Vercel・Supabase・X API・ドメインの実費をまかなう。月60米ドルを1ドル150円で換算した場合、表の費用は約9,000円。実際の損益分岐点はその他の費用を加えて更新する。
2. **継続して利益を出す。** 次の目安として、月間収益1万5,000円以上かつ月間の運用収支が3か月連続で黒字になることを目指す。ここでの運用収支は、開発・運営にかかる人件費を計上する前の指標とする。

広告収益の試算では、1,000ページビュー当たりの実受取額が300円なら、月9,000円に約3万ページビュー、月1万5,000円に約5万ページビューが必要です。300円は計算用の仮定です。公開後に得た実績で試算を更新します。
