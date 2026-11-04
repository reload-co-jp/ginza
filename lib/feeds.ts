import type { Article } from "./articles"
import {
  getAllArticles,
  getArticleImage,
  getArticlePublishedIso,
  getArticleTags,
} from "./articles"
import { absoluteUrl, siteDescription, siteName } from "./site"
import { escapeXml } from "./xml"

const articleUrl = (article: Article) =>
  absoluteUrl(`/articles/${article.slug}/`)

const publishedDate = (article: Article) =>
  new Date(getArticlePublishedIso(article))

export const buildRssFeedXml = (articles = getAllArticles()) => {
  const latest = articles[0] ? publishedDate(articles[0]) : new Date(0)
  const items = articles
    .map((article) => {
      const url = articleUrl(article)
      const image = getArticleImage(article)
      const categories = getArticleTags(article)
        .map((tag) => `<category>${escapeXml(tag.name)}</category>`)
        .join("")
      return `
    <item>
      <title>${escapeXml(article.title)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${escapeXml(article.summary)}</description>
      <pubDate>${publishedDate(article).toUTCString()}</pubDate>
      <media:content url="${absoluteUrl(image.src)}" medium="image" />${categories}
    </item>`
    })
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${absoluteUrl("/")}</link>
    <description>${escapeXml(siteDescription)}</description>
    <language>ja</language>
    <lastBuildDate>${latest.toUTCString()}</lastBuildDate>
    <atom:link href="${absoluteUrl("/rss.xml")}" rel="self" type="application/rss+xml" />${items}
  </channel>
</rss>`
}
