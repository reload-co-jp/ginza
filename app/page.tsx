import Link from "next/link"
import { ArticleGrid } from "@/components/elements/article-card"
import { Section } from "@/components/elements/page-header"
import {
  getAllAreas,
  getAllArticles,
  getArticleImage,
  getArticlesByAreaId,
  getEndingSoonEvents,
  getEventBadge,
  getEventStatus,
  getOngoingEvents,
  getUpcomingEvents,
  getUsedTags,
  getWeekendEvents,
} from "@/lib/articles"
import { formatDateRange, formatJaDate, getToday } from "@/lib/date"

const Page = () => {
  const today = getToday()
  const ongoing = getOngoingEvents(today)
  const weekend = getWeekendEvents(today)
  const upcoming = getUpcomingEvents(today)
  const endingSoon = getEndingSoonEvents(today)
  const latest = getAllArticles()
  // 終了していない最新記事をヒーローに出す
  const featured =
    latest.find(
      (a) => !a.event || getEventStatus(a.event, today) !== "ended"
    ) ?? latest[0]
  const featuredImage = getArticleImage(featured)

  return (
    <div id="content">
      <section className="hero">
        <div className="hero__text">
          <p className="hero__date">{formatJaDate(today, true)}の銀座</p>
          <h1 className="hero__title">
            今日、銀座で
            <br />
            何が起きている？
          </h1>
          <p className="hero__lead">
            開催中のイベントは<strong>{ongoing.length}件</strong>
            {endingSoon.length > 0 && (
              <>
                。うち<strong>{endingSoon.length}件</strong>は1週間以内に終了
              </>
            )}
            。銀座・有楽町・日比谷の「いま」をまとめてお届けします。
          </p>
          <div className="hero__actions">
            <Link href="/events/today/" className="button button--primary">
              今日のイベント
            </Link>
            <Link href="/events/this-weekend/" className="button">
              今週末のイベント
            </Link>
          </div>
        </div>
        <Link href={`/articles/${featured.slug}/`} className="hero__feature">
          <img
            src={featuredImage.src}
            alt={featuredImage.alt}
            width={featuredImage.width}
            height={featuredImage.height}
            className="hero__image"
            fetchPriority="high"
          />
          <span className="hero__feature-body">
            <span className="hero__feature-label">
              {featured.event ? getEventBadge(featured.event, today) : "注目"}
            </span>
            <span className="hero__feature-title">{featured.title}</span>
            {featured.event && (
              <span className="hero__feature-meta">
                {formatDateRange(
                  featured.event.startDate,
                  featured.event.endDate
                )}
              </span>
            )}
          </span>
        </Link>
      </section>

      <Section
        eyebrow="Now on"
        title="開催中のイベント"
        more={<Link href="/events/">すべて見る →</Link>}
      >
        <ArticleGrid
          articles={ongoing.slice(0, 6)}
          today={today}
          eagerCount={3}
          emptyMessage="現在開催中のイベント記事はありません。"
        />
      </Section>

      <Section
        eyebrow="Coming soon"
        title="これから始まるイベント"
        more={<Link href="/events/upcoming/">すべて見る →</Link>}
      >
        <ArticleGrid
          articles={upcoming.slice(0, 6)}
          today={today}
          emptyMessage="近日開始予定のイベント記事はありません。"
        />
      </Section>

      <Section
        eyebrow="Weekend"
        title="今週末に行けるイベント"
        more={<Link href="/events/this-weekend/">すべて見る →</Link>}
      >
        <ArticleGrid
          articles={weekend.slice(0, 3)}
          today={today}
          emptyMessage="今週末に開催されるイベント記事はありません。"
        />
      </Section>

      <Section
        eyebrow="Latest"
        title="新着記事"
        more={<Link href="/articles/">記事一覧 →</Link>}
      >
        <ArticleGrid articles={latest.slice(0, 6)} today={today} />
      </Section>

      <Section eyebrow="Area" title="エリアから探す">
        <ul className="area-list">
          {getAllAreas().map((area) => (
            <li key={area.id}>
              <Link href={`/areas/${area.id}/`} className="area-list__link">
                <span className="area-list__name">{area.name}</span>
                <span className="area-list__count">
                  {getArticlesByAreaId(area.id).length}件
                </span>
                <span className="area-list__desc">{area.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>

      <Section eyebrow="Tags" title="テーマから探す">
        <ul className="tag-cloud">
          {getUsedTags().map((tag) => (
            <li key={tag.id}>
              <Link href={`/tags/${tag.id}/`} className="tag-cloud__link">
                #{tag.name}
                <span className="tag-cloud__count">{tag.count}</span>
              </Link>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  )
}

export default Page
