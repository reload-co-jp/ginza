import type { Metadata } from "next"
import { ArticleGrid } from "@/components/elements/article-card"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { getAllArticles } from "@/lib/articles"
import { getToday } from "@/lib/date"

export const metadata: Metadata = {
  title: "新着記事一覧",
  description:
    "銀座・有楽町・日比谷のイベント、展覧会、ニューオープンなどの新着記事一覧。",
  alternates: { canonical: "/articles/" },
}

const Page = () => (
  <div id="content">
    <Breadcrumbs items={[{ label: "新着記事" }]} />
    <PageHeader
      eyebrow="Latest news"
      title="新着記事"
      lead="銀座エリアの最新ニュースを新しい順に掲載しています。"
    />
    <ArticleGrid
      articles={getAllArticles()}
      today={getToday()}
      headingLevel="h2"
      eagerCount={3}
    />
  </div>
)

export default Page
