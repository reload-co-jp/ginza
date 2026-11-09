// event.address から会場の緯度経度を求め、data/articles.json の event に
// latitude / longitude を書き足す。
// ジオコーディングは国土地理院の住所検索API（APIキー不要）を使う。
// 「〇丁目」止まりなど番地まで特定できない住所は地図の位置がずれるため書き込まない。
//
//   node scripts/geocode-events.mjs          # 書き込み
//   node scripts/geocode-events.mjs --dry    # 結果の表示のみ
import { readFileSync, writeFileSync } from "node:fs"
import path from "node:path"
import { setTimeout as sleep } from "node:timers/promises"

const FILE = path.resolve(import.meta.dirname, "../data/articles.json")
const API = "https://msearch.gsi.go.jp/address-search/AddressSearch?q="
const dry = process.argv.includes("--dry")

const text = readFileSync(FILE, "utf8")
const articles = JSON.parse(text)

const geocode = async (address) => {
  const res = await globalThis.fetch(API + encodeURIComponent(address))
  if (!res.ok) throw new Error(`${res.status} ${address}`)
  const [hit] = await res.json()
  if (!hit) return null
  const title = hit.properties.title
  // 番地（〇番、〇番〇号）まで一致した結果のみ採用する
  if (!/番/.test(title)) return { skipped: title }
  const [lng, lat] = hit.geometry.coordinates
  return { title, latitude: lat, longitude: lng }
}

const cache = new Map()
let out = text
let added = 0
for (const article of articles) {
  const event = article.event
  if (!event?.address || event.latitude != null) continue
  if (!cache.has(event.address)) {
    cache.set(event.address, await geocode(event.address))
    await sleep(300)
  }
  const result = cache.get(event.address)
  if (!result || result.skipped) {
    console.log(
      `skip  ${article.slug}: ${event.address}${result ? ` (${result.skipped})` : ""}`
    )
    continue
  }
  console.log(
    `add   ${article.slug}: ${event.address} -> ${result.latitude},${result.longitude}`
  )
  // 既存の整形を崩さないよう、該当記事の "address" 行の直後にテキストで挿入する
  const start = out.indexOf(`"slug": ${JSON.stringify(article.slug)}`)
  const line = `"address": ${JSON.stringify(event.address)},\n`
  const pos = out.indexOf(line, start)
  const next = out.indexOf('"slug": ', start + 1)
  if (start < 0 || pos < 0 || (next >= 0 && pos > next)) {
    console.warn(
      `warn  ${article.slug}: address 行が見つからないため手動で追加してください`
    )
    continue
  }
  const lineStart = out.lastIndexOf("\n", pos) + 1
  const indent = out.slice(lineStart, pos)
  const insertAt = pos + line.length
  out =
    out.slice(0, insertAt) +
    `${indent}"latitude": ${result.latitude},\n${indent}"longitude": ${result.longitude},\n` +
    out.slice(insertAt)
  added++
}

if (!dry && added > 0) writeFileSync(FILE, out)
console.log(`${dry ? "(dry) " : ""}${added} 件に座標を追加`)
