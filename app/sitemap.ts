import type { MetadataRoute } from "next"
import {
  getAllAreas,
  getAllArticles,
  getArticlePublishedIso,
  getArticlesByAreaId,
  getUsedTags,
} from "@/lib/articles"
import { absoluteUrl } from "@/lib/site"

export const dynamic = "force-static"

const staticPaths = [
  "/",
  "/articles/",
  "/events/",
  "/events/today/",
  "/events/this-weekend/",
  "/events/upcoming/",
  "/areas/",
  "/tags/",
  "/search/",
  "/about/",
  "/privacy/",
]

const sitemap = (): MetadataRoute.Sitemap => {
  const articles = getAllArticles()
  const latest = articles[0] ? getArticlePublishedIso(articles[0]) : undefined
  return [
    ...staticPaths.map((path) => ({
      url: absoluteUrl(path),
      lastModified: latest,
      changeFrequency: "daily" as const,
      priority: path === "/" ? 1 : 0.7,
    })),
    ...articles.map((article) => ({
      url: absoluteUrl(`/articles/${article.slug}/`),
      lastModified: getArticlePublishedIso(article),
      changeFrequency: "weekly" as const,
      priority: 0.8,
      ...(article.image && { images: [absoluteUrl(article.image.src)] }),
    })),
    ...getAllAreas()
      .filter((area) => getArticlesByAreaId(area.id).length > 0)
      .map((area) => ({
        url: absoluteUrl(`/areas/${area.id}/`),
        changeFrequency: "daily" as const,
        priority: 0.6,
      })),
    ...getUsedTags().map((tag) => ({
      url: absoluteUrl(`/tags/${tag.id}/`),
      changeFrequency: "daily" as const,
      priority: 0.5,
    })),
  ]
}

export default sitemap
