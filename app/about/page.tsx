import type { Metadata } from "next"
import Link from "next/link"
import { Breadcrumbs } from "@/components/elements/breadcrumbs"
import { PageHeader } from "@/components/elements/page-header"
import { siteDescription, siteName } from "@/lib/site"

export const metadata: Metadata = {
  title: "このサイトについて",
  description: siteDescription,
  alternates: { canonical: "/about/" },
}

const Page = () => (
  <div id="content" className="prose-page">
    <Breadcrumbs items={[{ label: "このサイトについて" }]} />
    <PageHeader eyebrow="About" title={`${siteName}について`} />
    <div className="prose">
      <p>
        {siteName}
        は、銀座・有楽町・日比谷を中心に、いま開催中のイベントや展覧会、百貨店の催事、イルミネーション、ニューオープンなどの最新情報をニュース記事として届けるWebメディアです。
      </p>
      <h2>編集方針</h2>
      <ul>
        <li>
          記事は主催者・施設の公式サイトやプレスリリースなど一次情報を確認して作成します。
        </li>
        <li>参照した公式URL・参考URLは各記事の末尾に掲載します。</li>
        <li>
          開催期間・料金などは記事公開時点の情報です。変更される場合があるため、お出かけ前に公式サイトをご確認ください。
        </li>
        <li>掲載画像は出典を明記しています。</li>
      </ul>
      <h2>サイトの使い方</h2>
      <ul>
        <li>
          <Link href="/events/today/">今日のイベント</Link>
          ：今日開催中のイベントを終了が近い順に掲載
        </li>
        <li>
          <Link href="/events/this-weekend/">今週末のイベント</Link>
          ：次の土日に開催されるイベント
        </li>
        <li>
          <Link href="/areas/">エリア</Link>・<Link href="/tags/">タグ</Link>
          ：エリアやテーマから記事を探す
        </li>
      </ul>
      <h2>運営</h2>
      <p>
        運営：<a href="https://reload.co.jp">株式会社リロード</a>
        <br />
        掲載内容の誤りや情報提供は運営会社までお知らせください。
      </p>
    </div>
  </div>
)

export default Page
