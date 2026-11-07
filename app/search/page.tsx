import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { SearchBox } from "@/components/elements/search-box"
import { getAllArticles, getArticleImage, getArticleTags } from "@/lib/articles"
import { normalize, type SearchEntry } from "@/lib/search"

export const metadata: Metadata = {
  title: "記事を検索",
  description: "銀座Nowの記事をキーワードで検索できます。",
  alternates: { canonical: "/search/" },
  // 検索ページは結果がクライアント側で変わるだけの薄いページなので索引させない
  robots: { index: false, follow: true },
}

const Page = () => {
  const entries: SearchEntry[] = getAllArticles().map((a) => {
    const tags = getArticleTags(a).map((t) => t.name)
    const image = getArticleImage(a)
    return {
      slug: a.slug,
      title: a.title,
      summary: a.summary,
      publishedAt: a.publishedAt,
      venue: a.event?.venue,
      tags,
      image: { src: image.src, alt: image.alt },
      text: normalize(
        [a.title, a.summary, a.content, a.event?.venue ?? "", ...tags].join(" ")
      ),
    }
  })
  return (
    <div id="content">
      <Breadcrumbs items={[{ label: "検索" }]} />
      <PageHeader
        eyebrow="Search"
        title="記事を検索"
        lead="スペース区切りで複数のキーワードを指定できます。"
      />
      <SearchBox entries={entries} />
    </div>
  )
}

export default Page
