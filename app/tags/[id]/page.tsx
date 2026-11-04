import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { ArticleGrid } from "@/components/elements/article-card"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { getArticlesByTagId, getTagById, getUsedTags } from "@/lib/articles"
import { getToday } from "@/lib/date"

type Props = { params: Promise<{ id: string }> }

export const dynamicParams = false

export const generateStaticParams = () =>
  getUsedTags().map((tag) => ({ id: String(tag.id) }))

export const generateMetadata = async ({
  params,
}: Props): Promise<Metadata> => {
  const tag = getTagById(Number((await params).id))
  if (!tag) return {}
  return {
    title: `銀座の${tag.name}の記事`,
    description: `銀座・有楽町・日比谷の「${tag.name}」に関するイベント・最新情報の記事一覧。`,
    alternates: { canonical: `/tags/${tag.id}/` },
  }
}

const Page = async ({ params }: Props) => {
  const tag = getTagById(Number((await params).id))
  if (!tag) notFound()
  const articles = getArticlesByTagId(tag.id)
  return (
    <div id="content">
      <Breadcrumbs
        items={[{ label: "タグ", href: "/tags/" }, { label: tag.name }]}
      />
      <PageHeader
        eyebrow="Tag"
        title={`#${tag.name}`}
        lead={`「${tag.name}」の記事は${articles.length}件です。`}
      />
      <ArticleGrid
        articles={articles}
        today={getToday()}
        headingLevel="h2"
        eagerCount={3}
      />
    </div>
  )
}

export default Page
