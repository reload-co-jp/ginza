---
name: ginza-article-writer
description: 銀座・有楽町・日比谷・東銀座・京橋エリアのイベント、展覧会、催事、イルミネーション、ニューオープンなどの記事を「銀座Now」に追加・更新するときに使う。情報源の確認、`data/articles.json` への追記、画像保存、検証まで扱う。
---

# 銀座Now 記事作成

## 手順

1. **候補を集める**: `references/source-list.md` の情報源から、銀座エリアで開催中・開催予定のイベントやニュースを探す。まとめて新規記事を探すときは `ginza-article-harvester`（`pnpm harvest scan`）を使う。
2. **重複チェック**: `data/articles.json` の `slug`・`title`・`sources[].url` と照合し、既存記事と同じイベントは追加しない（会期延長などは既存記事を更新）。
3. **事実確認**: 公式サイト・プレスリリースなど一次情報で、名称・会期・時間・会場・住所・料金・予約要否を確認する。確認できない項目は書かない（推測で埋めない）。
4. **画像を保存**: 公式・プレスリリースのキービジュアルを `pnpm harvest image "<画像URL>" "<slug>"` で `public/images/articles/<slug>.<ext>` に保存する。拡張子は実際の形式（`file` コマンドで確認）に合わせ、`width`/`height` を記録する。出典を `image.sourceLabel`/`image.sourceUrl` に書く。
5. **記事を追加**: `data/articles.json` に追記する。`id` は最大値+1。
6. **検証**: `pnpm validate:articles && pnpm test && pnpm build`。

## 記事データ

```json
{
  "id": 13,
  "title": "イベント名が銀座の会場で11月20日から開催",
  "seoTitle": "検索結果向けの短いタイトル（任意）",
  "slug": "event-name-ginza-2026",
  "summary": "一覧・meta description 用の要約（100〜150字）。",
  "content": "## 概要\n\n...\n\n## 内容\n\n...\n\n## 開催情報\n\n- **期間**: ...\n\n## こんな人におすすめ\n\n- ...",
  "publishedAt": "2026-11-04",
  "updatedAt": "2026-11-10",
  "tagIds": [1, 4],
  "areaId": "ginza",
  "image": {
    "src": "/images/articles/event-name-ginza-2026.webp",
    "alt": "画像の説明",
    "width": 1200,
    "height": 800,
    "sourceLabel": "公式サイト",
    "sourceUrl": "https://example.com"
  },
  "sources": [{ "label": "公式サイト", "url": "https://example.com" }],
  "event": {
    "venue": "会場名（フロア）",
    "address": "東京都中央区銀座...",
    "startDate": "2026-11-20",
    "endDate": "2026-12-25",
    "hours": "11:00〜20:00",
    "price": "入場無料",
    "reservation": false
  }
}
```

## ルール

- `title` は32字前後を目安。【銀座】などの接頭辞は付けない（`getSeoTitle()` が地名を含まない場合に付与）。
- 本文は `## 概要` / `## 内容` / `## 開催情報` / `## こんな人におすすめ` の4見出し。概要は2〜3文の文章、内容は文章＋箇条書き。施設オープンなどイベント以外の記事は `## 開催情報` を `## 施設情報` にし、`event` を省略してよい。
- 日付は `YYYY-MM-DD`（ゼロ埋め）。開催判定は文字列比較で行う。
- `updatedAt` は任意。公開後に本文や開催情報（会期延長・料金・予約方法など）を更新したときだけ作業日を入れる。新規記事には付けない。
- `event.price` は構造化データの `offers` にも使う。金額は「2,000円」のように「円」付きで書き、無料なら「無料」を含める。
- `areaId` は `data/areas.json` の `ginza` / `yurakucho-hibiya` / `higashi-ginza` / `kyobashi` から選ぶ。
- `tagIds` は `data/tags.json` の既存タグを優先。新しいタグが必要なら `tags.json` に追加する。
- `event.address` を書くと Event 構造化データが出力される。住所が確認できた場合のみ書く。
- `event.price` は表示用テキスト。料金が明記されていない屋外イベントは「屋外・観覧自由」など事実の範囲で書く。
- `sources` は信頼度順（公式 → チケット・会場 → プレスリリース → まとめサイト）。画像出典 URL も含める。
- すでに終了した部分（応募締切、前期展示など）は本文で明記する。
