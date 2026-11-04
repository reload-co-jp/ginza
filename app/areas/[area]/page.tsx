import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArticleGrid } from "@/components/elements/article-card"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { getAllAreas, getAreaById, getArticlesByAreaId } from "@/lib/articles"
import { getToday } from "@/lib/date"

type Props = { params: Promise<{ area: string }> }

export const dynamicParams = false

export const generateStaticParams = () =>
  getAllAreas().map((area) => ({ area: area.id }))

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const area = getAreaById((await params).area)
  if (!area) return {}
  return {
    title: `${area.name}のイベント・最新情報`,
    description: area.description,
    alternates: { canonical: `/areas/${area.id}/` },
  }
}

const Page = async ({ params }: Props) => {
  const area = getAreaById((await params).area)
  if (!area) notFound()
  return (
    <div id="content">
      <Breadcrumbs
        items={[{ label: "エリア", href: "/areas/" }, { label: area.name }]}
      />
      <PageHeader
        eyebrow="Area"
        title={`${area.name}のイベント・最新情報`}
        lead={area.description}
      />
      <ArticleGrid
        articles={getArticlesByAreaId(area.id)}
        today={getToday()}
        headingLevel="h2"
        eagerCount={3}
      />
    </div>
  )
}

export default Page
