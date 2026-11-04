<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# 銀座Now（このリポジトリ）

- 記事データは `data/articles.json`。形式と執筆ルールは `README.md` と `.claude/skills/ginza-article-writer/SKILL.md` を参照。
- 記事を追加・編集したら `pnpm validate:articles`、`pnpm test`、`pnpm build` を実行する。
