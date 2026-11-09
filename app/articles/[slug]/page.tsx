import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import { marked } from "marked"
import { InArticleAd } from "@/components/elements/ad"
import { ArticleGrid } from "@/components/elements/article-card"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import {
  getAllArticles,
  getAreaById,
  getArticleBySlug,
  getArticleImage,
  getArticleLinkSources,
  getArticleModifiedIso,
  getArticlePublishedIso,
  getArticleTags,
  getEventBadge,
  getEventStatus,
  getRelatedArticles,
  getSeoTitle,
} from "@/lib/articles"
import { formatDateRange, formatDotDate, getToday } from "@/lib/date"
import { googleMapsUrl, PlaceMap } from "@/components/elements/place-map"
import { jsonLdScript, toOffer, toPostalAddress } from "@/lib/json-ld"
import { absoluteUrl, siteName } from "@/lib/site"

type Props = { params: Promise<{ slug: string }> }

export const dynamicParams = false

export const generateStaticParams = () =>
  getAllArticles().map((article) => ({ slug: article.slug }))

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) return {}
  const image = getArticleImage(article)
  const title = getSeoTitle(article)
  const url = `/articles/${slug}/`
  return {
    title,
    description: article.summary,
    keywords: [
      "銀座",
      "銀座 イベント",
      ...getArticleTags(article).map((t) => t.name),
    ],
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      siteName,
      locale: "ja_JP",
      title,
      description: article.summary,
      url,
      publishedTime: getArticlePublishedIso(article),
      modifiedTime: getArticleModifiedIso(article),
      tags: getArticleTags(article).map((t) => t.name),
      images: [
        {
          url: image.src,
          alt: image.alt,
          width: image.width,
          height: image.height,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: article.summary,
      images: [image.src],
    },
  }
}

const Page = async ({ params }: Props) => {
  const { slug } = await params
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const today = getToday()
  const html = await marked.parse(article.content)
  const image = getArticleImage(article)
  const tags = getArticleTags(article)
  const area = getAreaById(article.areaId)
  const related = getRelatedArticles(article)
  const sources = getArticleLinkSources(article)
  const event = article.event
  const publishedIso = getArticlePublishedIso(article)
  const modifiedIso = getArticleModifiedIso(article)
  const articleUrl = absoluteUrl(`/articles/${article.slug}/`)

  const jsonLd: Record<string, unknown>[] = [
    {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: article.title,
      description: article.summary,
      image: [absoluteUrl(image.src)],
      datePublished: publishedIso,
      dateModified: modifiedIso,
      mainEntityOfPage: articleUrl,
      author: {
        "@type": "Organization",
        name: `${siteName}編集部`,
        url: absoluteUrl("/about/"),
      },
      publisher: { "@id": absoluteUrl("/#organization") },
      keywords: tags.map((t) => t.name),
    },
  ]
  // 緯度経度があれば地図を表示し、構造化データにも含める
  const coords =
    event?.latitude != null && event.longitude != null
      ? { latitude: event.latitude, longitude: event.longitude }
      : undefined
  if (event && event.address) {
    const offer = toOffer(event.price, articleUrl)
    jsonLd.push({
      "@context": "https://schema.org",
      "@type": "Event",
      name: article.title,
      description: article.summary,
      startDate: event.startDate,
      endDate: event.endDate,
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      image: [absoluteUrl(image.src)],
      location: {
        "@type": "Place",
        name: event.venue,
        address: toPostalAddress(event.address),
        ...(coords && {
          geo: { "@type": "GeoCoordinates", ...coords },
          hasMap: googleMapsUrl(coords.latitude, coords.longitude),
        }),
      },
      ...(offer && { offers: offer }),
      url: articleUrl,
    })
  }

  return (
    <article id="content" className="article">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
      <Breadcrumbs
        items={[
          ...(area ? [{ label: area.name, href: `/areas/${area.id}/` }] : []),
          { label: article.title },
        ]}
      />
      <header className="article__header">
        <p className="article__kicker">
          {area && <Link href={`/areas/${area.id}/`}>{area.name}</Link>}
          {event && (
            <span
              className={`article__status article__status--${getEventStatus(event, today)}`}
            >
              {getEventBadge(event, today)}
            </span>
          )}
        </p>
        <h1 className="article__title">{article.title}</h1>
        <p className="article__summary">{article.summary}</p>
        <p className="article__byline">
          <time dateTime={publishedIso}>
            {formatDotDate(article.publishedAt)}
          </time>
          {modifiedIso !== publishedIso && article.updatedAt && (
            <span>
              更新{" "}
              <time dateTime={modifiedIso}>
                {formatDotDate(article.updatedAt)}
              </time>
            </span>
          )}
          <span>{siteName}編集部</span>
        </p>
      </header>

      <figure className="article__figure">
        <img
          src={image.src}
          alt={image.alt}
          width={image.width}
          height={image.height}
          className="article__image"
          fetchPriority="high"
        />
        {article.image?.sourceLabel && (
          <figcaption>
            画像：
            {article.image.sourceUrl ? (
              <a
                href={article.image.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                {article.image.sourceLabel}
              </a>
            ) : (
              article.image.sourceLabel
            )}
          </figcaption>
        )}
      </figure>

      {event && (
        <aside className="event-box" aria-label="開催概要">
          <h2 className="event-box__title">開催概要</h2>
          <dl className="event-box__list">
            <dt>期間</dt>
            <dd>{formatDateRange(event.startDate, event.endDate)}</dd>
            {event.hours && (
              <>
                <dt>時間</dt>
                <dd>{event.hours}</dd>
              </>
            )}
            <dt>会場</dt>
            <dd>{event.venue}</dd>
            {event.address && (
              <>
                <dt>住所</dt>
                <dd>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {event.address}
                  </a>
                </dd>
              </>
            )}
            <dt>料金</dt>
            <dd>{event.price}</dd>
            <dt>予約</dt>
            <dd>{event.reservation ? "必要（日時指定など）" : "不要"}</dd>
          </dl>
          {coords && <PlaceMap {...coords} name={event.venue} />}
        </aside>
      )}

      <div
        className="article__body"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      <InArticleAd />

      {sources.length > 0 && (
        <section className="article__sources">
          <h2>公式URL・参考URL</h2>
          <ul>
            {sources.map((source) => (
              <li key={`${source.label}-${source.url}`}>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {source.label}
                  </a>
                ) : (
                  source.label
                )}
              </li>
            ))}
          </ul>
          <p className="article__note">
            記事の内容は公開時点の情報です。開催内容や営業時間は変更される場合があるため、お出かけ前に公式サイトをご確認ください。
          </p>
        </section>
      )}

      {tags.length > 0 && (
        <ul className="tag-cloud article__tags">
          {tags.map((tag) => (
            <li key={tag.id}>
              <Link href={`/tags/${tag.id}/`} className="tag-cloud__link">
                #{tag.name}
              </Link>
            </li>
          ))}
        </ul>
      )}

      {related.length > 0 && (
        <section className="section">
          <div className="section__head">
            <div>
              <p className="section__eyebrow">Related</p>
              <h2 className="section__title">あわせて読みたい</h2>
            </div>
          </div>
          <ArticleGrid articles={related} today={today} />
        </section>
      )}
    </article>
  )
}

export default Page
