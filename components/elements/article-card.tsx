import Link from "next/link"
import {
  type Article,
  getAreaById,
  getArticleImage,
  getArticleTags,
  getEventBadge,
  getEventStatus,
} from "@/lib/articles"
import { formatDateRange, formatDotDate } from "@/lib/date"

type Props = {
  article: Article
  /** 指定するとイベントの開催状況バッジを表示する。 */
  today?: string
  headingLevel?: "h2" | "h3"
  /** 最初の数枚は eager にして LCP を早める。 */
  eager?: boolean
}

export const ArticleCard = ({
  article,
  today,
  headingLevel = "h3",
  eager = false,
}: Props) => {
  const image = getArticleImage(article)
  const area = getAreaById(article.areaId)
  const tags = getArticleTags(article).slice(0, 3)
  const Heading = headingLevel
  const status =
    article.event && today ? getEventStatus(article.event, today) : undefined

  return (
    <li className="card">
      <Link href={`/articles/${article.slug}/`} className="card__link">
        <div className="card__media">
          <img
            src={image.src}
            alt={image.alt}
            width={image.width}
            height={image.height}
            loading={eager ? "eager" : "lazy"}
            decoding="async"
            className="card__image"
          />
          {article.event && today && (
            <span className={`card__badge card__badge--${status}`}>
              {getEventBadge(article.event, today)}
            </span>
          )}
        </div>
        <div className="card__body">
          <p className="card__kicker">
            {area && <span className="card__area">{area.name}</span>}
            {tags.map((tag) => (
              <span key={tag.id} className="card__tag">
                #{tag.name}
              </span>
            ))}
          </p>
          <Heading className="card__title">{article.title}</Heading>
          {article.event ? (
            <dl className="card__meta">
              <dt>期間</dt>
              <dd>
                {formatDateRange(
                  article.event.startDate,
                  article.event.endDate
                )}
              </dd>
              <dt>会場</dt>
              <dd>{article.event.venue}</dd>
            </dl>
          ) : (
            <p className="card__summary">{article.summary}</p>
          )}
          <time className="card__date" dateTime={article.publishedAt}>
            {formatDotDate(article.publishedAt)}
          </time>
        </div>
      </Link>
    </li>
  )
}

export const ArticleGrid = ({
  articles,
  today,
  headingLevel,
  eagerCount = 0,
  emptyMessage = "該当する記事はまだありません。",
}: {
  articles: Article[]
  today?: string
  headingLevel?: "h2" | "h3"
  eagerCount?: number
  emptyMessage?: string
}) =>
  articles.length === 0 ? (
    <p className="empty">{emptyMessage}</p>
  ) : (
    <ul className="card-grid">
      {articles.map((article, i) => (
        <ArticleCard
          key={article.slug}
          article={article}
          today={today}
          headingLevel={headingLevel}
          eager={i < eagerCount}
        />
      ))}
    </ul>
  )
