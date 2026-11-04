import type { Article } from "./articles"
import { getAllArticles, getArticlePublishedIso } from "./articles"
import { absoluteUrl, siteName } from "./site"
import { escapeXml } from "./xml"

const NEWS_WINDOW_MS = 48 * 60 * 60 * 1000

/** Google ニュース サイトマップは直近48時間の記事のみ対象。 */
export const getRecentNewsArticles = (now = new Date()): Article[] =>
  getAllArticles().filter((article) => {
    const t = new Date(getArticlePublishedIso(article)).getTime()
    return t >= now.getTime() - NEWS_WINDOW_MS && t <= now.getTime()
  })

export const buildNewsSitemapXml = (articles = getRecentNewsArticles()) => {
  const urls = articles
    .map(
      (article) => `
  <url>
    <loc>${absoluteUrl(`/articles/${article.slug}/`)}</loc>
    <news:news>
      <news:publication>
        <news:name>${escapeXml(siteName)}</news:name>
        <news:language>ja</news:language>
      </news:publication>
      <news:publication_date>${getArticlePublishedIso(article)}</news:publication_date>
      <news:title>${escapeXml(article.title)}</news:title>
    </news:news>
  </url>`
    )
    .join("")

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">${urls}
</urlset>`
}
