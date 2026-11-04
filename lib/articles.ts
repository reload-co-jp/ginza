import articlesData from "../data/articles.json"
import areasData from "../data/areas.json"
import tagsData from "../data/tags.json"
import { addDays, daysBetween, getWeekendRange } from "./date"

export type Tag = {
  id: number
  name: string
}

export type Area = {
  id: string
  name: string
  description: string
}

export type ArticleEvent = {
  venue: string
  address?: string
  startDate: string
  endDate: string
  hours?: string
  price: string
  reservation: boolean
}

export type Article = {
  id: number
  title: string
  /** 長いタイトルのみ。<title>/OGPで使う短縮版。 */
  seoTitle?: string
  slug: string
  summary: string
  content: string
  publishedAt: string
  tagIds: number[]
  areaId: string
  image?: {
    src: string
    alt: string
    width?: number
    height?: number
    sourceLabel?: string
    sourceUrl?: string
  }
  sources?: { label: string; url?: string }[]
  event?: ArticleEvent
}

export type EventArticle = Article & { event: ArticleEvent }

export type EventStatus = "upcoming" | "ongoing" | "ended"

const articles = articlesData as Article[]
const tags = tagsData as Tag[]
const areas = areasData as Area[]

export const placeholderImage = {
  src: "/images/placeholder.svg",
  alt: "銀座Nowの記事サムネイル",
  width: 1200,
  height: 800,
}

const byPublishedDesc = (a: Article, b: Article) =>
  b.publishedAt.localeCompare(a.publishedAt) || b.id - a.id

export const getAllArticles = (): Article[] =>
  [...articles].sort(byPublishedDesc)

export const getArticleBySlug = (slug: string): Article | undefined =>
  articles.find((a) => a.slug === slug)

export const getAllTags = (): Tag[] => tags

export const getTagById = (id: number): Tag | undefined =>
  tags.find((t) => t.id === id)

export const getArticleTags = (article: Article): Tag[] =>
  article.tagIds.map(getTagById).filter((t): t is Tag => Boolean(t))

/** 記事が1件以上ある タグのみ。記事数の多い順。 */
export const getUsedTags = (): (Tag & { count: number })[] =>
  tags
    .map((tag) => ({
      ...tag,
      count: articles.filter((a) => a.tagIds.includes(tag.id)).length,
    }))
    .filter((tag) => tag.count > 0)
    .sort((a, b) => b.count - a.count || a.id - b.id)

export const getArticlesByTagId = (id: number): Article[] =>
  getAllArticles().filter((a) => a.tagIds.includes(id))

export const getAllAreas = (): Area[] => areas

export const getAreaById = (id: string): Area | undefined =>
  areas.find((a) => a.id === id)

export const getArticlesByAreaId = (id: string): Article[] =>
  getAllArticles().filter((a) => a.areaId === id)

export const getArticleImage = (article: Article) => {
  if (!article.image) return placeholderImage
  const { src, alt, width, height } = article.image
  return { src, alt, width, height }
}

export const getSeoTitle = (article: Article) => {
  const title = article.seoTitle ?? article.title
  return /銀座|有楽町|日比谷|築地|京橋/.test(title) ? title : `【銀座】${title}`
}

export const getArticlePublishedIso = (article: Article) =>
  /^\d{4}-\d{2}-\d{2}$/.test(article.publishedAt)
    ? `${article.publishedAt}T00:00:00+09:00`
    : article.publishedAt

// ---- events ----

const isEvent = (a: Article): a is EventArticle => Boolean(a.event)

export const getAllEvents = (): EventArticle[] =>
  getAllArticles().filter(isEvent)

export const getEventStatus = (
  event: ArticleEvent,
  today: string
): EventStatus => {
  if (today < event.startDate) return "upcoming"
  if (today > event.endDate) return "ended"
  return "ongoing"
}

const byEndDateAsc = (a: EventArticle, b: EventArticle) =>
  a.event.endDate.localeCompare(b.event.endDate) || a.id - b.id

const byStartDateAsc = (a: EventArticle, b: EventArticle) =>
  a.event.startDate.localeCompare(b.event.startDate) || a.id - b.id

/** 期間が [from, to] と重なるイベント。 */
export const getEventsInRange = (from: string, to: string): EventArticle[] =>
  getAllEvents()
    .filter((a) => a.event.startDate <= to && a.event.endDate >= from)
    .sort(byEndDateAsc)

/** 今日開催中。終了が近い順。 */
export const getOngoingEvents = (today: string): EventArticle[] =>
  getEventsInRange(today, today)

/** 今週末（土日）に開催されるイベント。 */
export const getWeekendEvents = (today: string): EventArticle[] => {
  const { start, end } = getWeekendRange(today)
  return getEventsInRange(start, end)
}

/** これから始まるイベント。開始が近い順。 */
export const getUpcomingEvents = (today: string, days = 60): EventArticle[] => {
  const limit = addDays(today, days)
  return getAllEvents()
    .filter((a) => a.event.startDate > today && a.event.startDate <= limit)
    .sort(byStartDateAsc)
}

/** 開催中で、終了まで `days` 日以内のイベント。 */
export const getEndingSoonEvents = (today: string, days = 7): EventArticle[] =>
  getOngoingEvents(today).filter(
    (a) => daysBetween(today, a.event.endDate) <= days
  )

/** 開催状況のラベル。カードのバッジ表示用。 */
export const getEventBadge = (event: ArticleEvent, today: string): string => {
  const status = getEventStatus(event, today)
  if (status === "ended") return "終了"
  if (status === "upcoming") {
    const days = daysBetween(today, event.startDate)
    return days === 1 ? "明日から" : `${days}日後に開始`
  }
  const left = daysBetween(today, event.endDate)
  if (left === 0) return "本日まで"
  if (left <= 7) return `あと${left}日`
  return "開催中"
}

// ---- related ----

/** タグの一致数が多い順、同数なら新しい順。 */
export const getRelatedArticles = (article: Article, limit = 6): Article[] =>
  getAllArticles()
    .filter((c) => c.slug !== article.slug)
    .map((c) => ({
      article: c,
      score:
        c.tagIds.filter((id) => article.tagIds.includes(id)).length +
        (c.areaId === article.areaId ? 0.5 : 0),
    }))
    .filter((c) => c.score >= 1)
    .sort((a, b) => b.score - a.score || byPublishedDesc(a.article, b.article))
    .slice(0, limit)
    .map((c) => c.article)

/** sources と画像出典を URL で重複除去して返す。 */
export const getArticleLinkSources = (article: Article) => {
  const links = [
    ...(article.sources ?? []),
    ...(article.image?.sourceUrl
      ? [
          {
            label: article.image.sourceLabel ?? "画像出典",
            url: article.image.sourceUrl,
          },
        ]
      : []),
  ]
  return links.filter(
    (s, i, all) => s.url == null || all.findIndex((c) => c.url === s.url) === i
  )
}
