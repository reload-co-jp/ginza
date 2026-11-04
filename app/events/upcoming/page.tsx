import type { Metadata } from "next"
import { ArticleGrid } from "@/components/elements/article-card"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { getUpcomingEvents } from "@/lib/articles"
import { getToday } from "@/lib/date"

export const metadata: Metadata = {
  title: "これから始まる銀座のイベント",
  description:
    "銀座・有楽町・日比谷でこれから開催されるイベントを開始日が近い順にまとめています。",
  alternates: { canonical: "/events/upcoming/" },
}

const Page = () => {
  const today = getToday()
  const events = getUpcomingEvents(today, 365)
  return (
    <div id="content">
      <Breadcrumbs
        items={[
          { label: "イベント", href: "/events/" },
          { label: "これから始まるイベント" },
        ]}
      />
      <PageHeader
        eyebrow="Coming soon"
        title="これから始まる銀座のイベント"
        lead="開始日が近い順に並べています。"
      />
      <ArticleGrid
        articles={events}
        today={today}
        headingLevel="h2"
        eagerCount={3}
        emptyMessage="開催予定のイベント記事はありません。"
      />
    </div>
  )
}

export default Page
