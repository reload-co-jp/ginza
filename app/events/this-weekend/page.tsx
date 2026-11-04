import type { Metadata } from "next"
import { ArticleGrid } from "@/components/elements/article-card"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { getWeekendEvents } from "@/lib/articles"
import { formatJaDate, getToday, getWeekendRange } from "@/lib/date"

export const metadata: Metadata = {
  title: "今週末の銀座のイベント",
  description:
    "今週末（土日）に銀座・有楽町・日比谷で開催されるイベントのまとめ。",
  alternates: { canonical: "/events/this-weekend/" },
}

const Page = () => {
  const today = getToday()
  const { start, end } = getWeekendRange(today)
  const events = getWeekendEvents(today)
  return (
    <div id="content">
      <Breadcrumbs
        items={[
          { label: "イベント", href: "/events/" },
          { label: "今週末のイベント" },
        ]}
      />
      <PageHeader
        eyebrow="This weekend"
        title="今週末の銀座のイベント"
        lead={`${formatJaDate(start)}・${formatJaDate(end)}に開催されるイベントは${events.length}件です。`}
      />
      <ArticleGrid
        articles={events}
        today={today}
        headingLevel="h2"
        eagerCount={3}
        emptyMessage="今週末に開催されるイベント記事はありません。"
      />
    </div>
  )
}

export default Page
