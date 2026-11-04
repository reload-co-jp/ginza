import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { getAllAreas, getArticlesByAreaId } from "@/lib/articles"

export const metadata: Metadata = {
  title: "エリアから探す",
  description:
    "銀座、有楽町・日比谷、東銀座・築地、銀座一丁目・京橋のエリア別に記事を探せます。",
  alternates: { canonical: "/areas/" },
}

const Page = () => (
  <div id="content">
    <Breadcrumbs items={[{ label: "エリア" }]} />
    <PageHeader eyebrow="Area" title="エリアから探す" />
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
  </div>
)

export default Page
