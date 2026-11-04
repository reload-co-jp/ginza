// data/articles.json の整合性チェック。`pnpm validate:articles` で実行。
import { existsSync, readFileSync } from "node:fs"
import path from "node:path"

const root = path.resolve(import.meta.dirname, "..")
const read = (p) => JSON.parse(readFileSync(path.join(root, p), "utf8"))

const articles = read("data/articles.json")
const tagIds = new Set(read("data/tags.json").map((t) => t.id))
const areaIds = new Set(read("data/areas.json").map((a) => a.id))

const DATE = /^\d{4}-\d{2}-\d{2}$/
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const errors = []
const seenIds = new Set()
const seenSlugs = new Set()

for (const a of articles) {
  const where = `#${a.id ?? "?"} ${a.slug ?? ""}`
  const err = (msg) => errors.push(`${where}: ${msg}`)

  for (const key of [
    "id",
    "title",
    "slug",
    "summary",
    "content",
    "publishedAt",
    "tagIds",
    "areaId",
  ]) {
    if (a[key] === undefined || a[key] === "") err(`${key} がありません`)
  }
  if (seenIds.has(a.id)) err("id が重複しています")
  seenIds.add(a.id)
  if (seenSlugs.has(a.slug)) err("slug が重複しています")
  seenSlugs.add(a.slug)
  if (a.slug && !SLUG.test(a.slug))
    err("slug は半角英小文字・数字・ハイフンのみ")
  if (a.publishedAt && !DATE.test(a.publishedAt))
    err("publishedAt は YYYY-MM-DD")
  if (a.title?.startsWith("【"))
    err("title に【銀座】などの接頭辞は付けない（表示時に付与）")
  if (!a.content?.startsWith("## ")) err("content は ## 見出しから始める")
  for (const id of a.tagIds ?? [])
    if (!tagIds.has(id)) err(`未定義の tagId: ${id}`)
  if (a.areaId && !areaIds.has(a.areaId)) err(`未定義の areaId: ${a.areaId}`)

  if (a.image) {
    if (!a.image.alt) err("image.alt がありません")
    if (!existsSync(path.join(root, "public", a.image.src)))
      err(`画像ファイルがありません: ${a.image.src}`)
  }
  for (const s of a.sources ?? []) {
    if (!s.label) err("sources[].label がありません")
    if (s.url && !/^https?:\/\//.test(s.url))
      err(`sources[].url が不正: ${s.url}`)
  }
  if (a.event) {
    const e = a.event
    for (const key of ["venue", "startDate", "endDate", "price"]) {
      if (!e[key]) err(`event.${key} がありません`)
    }
    if (typeof e.reservation !== "boolean") err("event.reservation は boolean")
    if (!DATE.test(e.startDate ?? "") || !DATE.test(e.endDate ?? ""))
      err("event の日付は YYYY-MM-DD")
    else if (e.startDate > e.endDate)
      err("event.startDate が endDate より後です")
  }
}

if (errors.length) {
  console.error(errors.join("\n"))
  console.error(`\n${errors.length} 件のエラー`)
  process.exit(1)
}
console.log(`OK: ${articles.length} 件の記事を検証しました`)
