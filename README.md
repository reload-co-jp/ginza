# 銀座Now

銀座・有楽町・日比谷で開催中のイベント、展覧会、催事、イルミネーション、ニューオープンなどの最新情報を、ニュース記事として届ける静的Webメディアです。姉妹サイト「アキバLive」（akiba）、浅草（asakusa）と同じ構成（Next.js の静的出力 + JSON 管理）で作っています。

本番URL（予定）: `https://ginza.reload.co.jp`（`NEXT_PUBLIC_SITE_URL` で変更可）

## 技術スタック

- Next.js 16（App Router / `output: "export"`）
- React 19 / TypeScript
- `marked`（記事本文の Markdown 変換）
- Vitest + Testing Library
- GitHub Pages へ自動デプロイ（main への push と毎日 JST 0:05 の再ビルド）

## コマンド

```bash
pnpm install
pnpm dev                 # 開発サーバー
pnpm build               # 静的出力（out/）
pnpm test                # ユニットテスト
pnpm lint
pnpm typecheck
pnpm validate:articles   # data/articles.json の整合性チェック
```

## ページ構成

- `/` トップ（今日の銀座・開催中・これから・今週末・新着・エリア・タグ）
- `/articles/` 新着記事一覧、`/articles/[slug]/` 記事詳細
- `/events/` イベント一覧（開催中・開催予定・終了）
- `/events/today/` 今日行けるイベント
- `/events/this-weekend/` 今週末のイベント
- `/events/upcoming/` これから始まるイベント
- `/areas/`、`/areas/[area]/` エリア別
- `/tags/`、`/tags/[id]/` タグ別
- `/search/` 記事検索（クライアントサイド）
- `/about/`、`/privacy/`
- `/rss.xml`、`/sitemap.xml`、`/news-sitemap.xml`、`/robots.txt`

「今日」「今週末」などの判定はビルド時の日本時間で行います。毎日再ビルドすることで表示を更新します。`GINZA_TODAY=2026-12-24 pnpm build` のように日付を固定して確認できます。

## データ

- `data/articles.json`: 記事（イベント情報を含む）
- `data/tags.json`: タグマスタ
- `data/areas.json`: エリアマスタ（`ginza` / `yurakucho-hibiya` / `higashi-ginza` / `kyobashi`）
- `public/images/articles/`: 記事サムネイル

記事の形式・執筆ルールは `.claude/skills/ginza-article-writer/SKILL.md`、情報源の一覧は同ディレクトリの `references/source-list.md` を参照してください。型定義は `lib/articles.ts` にあります。

## ディレクトリ構成

```text
app/          ルーティング（ページ、RSS、サイトマップ）
components/   共通UI（レイアウト、記事カード、パンくず、検索）
data/         JSONデータ
lib/          データアクセス、日付処理、フィード生成
public/       画像など静的ファイル
scripts/      検証スクリプト
```

## 今後の拡張候補

- 英語・中国語ページ（akiba の `en` / `zh` フィールド方式）
- 会場（スポット）マスタと地図表示
- 記事収集の自動化（akiba の harvester 相当）
- アクセス解析・広告の導入
