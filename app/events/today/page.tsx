import type { Metadata } from "next"
import { ArticleGrid } from "@/components/elements/article-card"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { getOngoingEvents } from "@/lib/articles"
import { formatJaDate, getToday } from "@/lib/date"

export const metadata: Metadata = {
  title: "今日行ける銀座のイベント",
  description:
    "今日、銀座・有楽町・日比谷で開催中のイベントを終了が近い順にまとめています。",
  alternates: { canonical: "/events/today/" },
}

const Page = () => {
  const today = getToday()
  const events = getOngoingEvents(today)
  return (
    <div id="content">
      <Breadcrumbs
        items={[
          { label: "イベント", href: "/events/" },
          { label: "今日のイベント" },
        ]}
      />
      <PageHeader
        eyebrow="Today"
        title="今日行ける銀座のイベント"
        lead={`${formatJaDate(today, true)}に開催中のイベントは${events.length}件。終了が近い順に並べています。`}
      />
      <ArticleGrid
        articles={events}
        today={today}
        headingLevel="h2"
        eagerCount={3}
        emptyMessage="今日開催中のイベント記事はありません。"
      />
    </div>
  )
}

export default Page
