import type { Metadata } from "next"
import Link from "next/link"
import { ArticleGrid } from "@/components/elements/article-card"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader, Section } from "@/components/elements/page-header"
import {
  getAllEvents,
  getEventStatus,
  getOngoingEvents,
  getUpcomingEvents,
} from "@/lib/articles"
import { getToday } from "@/lib/date"

export const metadata: Metadata = {
  title: "銀座のイベント一覧（開催中・開催予定）",
  description:
    "銀座・有楽町・日比谷で開催中のイベントと、これから始まるイベントの一覧。展覧会、イルミネーション、催事、ポップアップなど。",
  alternates: { canonical: "/events/" },
}

const Page = () => {
  const today = getToday()
  const ongoing = getOngoingEvents(today)
  const upcoming = getUpcomingEvents(today, 365)
  const ended = getAllEvents().filter(
    (a) => getEventStatus(a.event, today) === "ended"
  )
  return (
    <div id="content">
      <Breadcrumbs items={[{ label: "イベント" }]} />
      <PageHeader
        eyebrow="Events"
        title="銀座のイベント"
        lead={
          <>
            開催中のイベントは終了が近い順、これから始まるイベントは開始が近い順に並べています。
            <Link href="/events/this-weekend/">今週末のイベント</Link>
            もチェック。
          </>
        }
      />
      <Section eyebrow="Now on" title={`開催中（${ongoing.length}件）`}>
        <ArticleGrid
          articles={ongoing}
          today={today}
          eagerCount={3}
          emptyMessage="現在開催中のイベント記事はありません。"
        />
      </Section>
      <Section eyebrow="Coming soon" title={`開催予定（${upcoming.length}件）`}>
        <ArticleGrid
          articles={upcoming}
          today={today}
          emptyMessage="開催予定のイベント記事はありません。"
        />
      </Section>
      {ended.length > 0 && (
        <Section eyebrow="Archive" title="終了したイベント">
          <ArticleGrid articles={ended} today={today} />
        </Section>
      )}
    </div>
  )
}

export default Page
