import type { Metadata } from "next"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { siteName } from "@/lib/site"

export const metadata: Metadata = {
  title: "プライバシーポリシー",
  description: `${siteName}のプライバシーポリシー。`,
  alternates: { canonical: "/privacy/" },
}

const Page = () => (
  <div id="content" className="prose-page">
    <Breadcrumbs items={[{ label: "プライバシーポリシー" }]} />
    <PageHeader eyebrow="Privacy" title="プライバシーポリシー" />
    <div className="prose">
      <p>
        {siteName}
        （以下「当サイト」）は、利用者の個人情報の取り扱いについて以下のとおり定めます。
      </p>
      <h2>アクセス解析・広告について</h2>
      <p>
        当サイトでは、サイトの改善や広告配信のため、Cookie等を利用したアクセス解析ツールや広告配信サービスを導入する場合があります。これらのツールは個人を特定する情報を含まないトラフィックデータを収集します。Cookieはブラウザの設定で無効にできます。
      </p>
      <h2>外部リンクについて</h2>
      <p>
        当サイトの記事には主催者・施設の公式サイトなど外部サイトへのリンクが含まれます。リンク先での個人情報の取り扱いについては、各サイトのポリシーをご確認ください。
      </p>
      <h2>免責事項</h2>
      <p>
        当サイトの情報は記事公開時点のものであり、正確性・完全性を保証するものではありません。当サイトの情報を利用したことによる損害について、当サイトは責任を負いません。
      </p>
      <h2>改定</h2>
      <p>本ポリシーは必要に応じて改定することがあります。</p>
      <p>制定日：2026年11月4日</p>
    </div>
  </div>
)

export default Page
