import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { getUsedTags } from "@/lib/articles"

export const metadata: Metadata = {
  title: "タグ一覧",
  description:
    "イルミネーション、アート、グルメなど、テーマ別に銀座の記事を探せます。",
  alternates: { canonical: "/tags/" },
}

const Page = () => (
  <div id="content">
    <Breadcrumbs items={[{ label: "タグ" }]} />
    <PageHeader eyebrow="Tags" title="テーマから探す" />
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
  </div>
)

export default Page
