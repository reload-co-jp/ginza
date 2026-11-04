import Link from "next/link"
import { PageHeader } from "@/components/elements/page-header"

const NotFound = () => (
  <div id="content">
    <PageHeader
      eyebrow="404"
      title="ページが見つかりません"
      lead="お探しのページは移動または削除された可能性があります。"
    />
    <p>
      <Link href="/" className="button button--primary">
        トップへ戻る
      </Link>
    </p>
  </div>
)

export default NotFound
