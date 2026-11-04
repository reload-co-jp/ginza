import Link from "next/link"
import { jsonLdScript } from "@/lib/json-ld"
import { absoluteUrl } from "@/lib/site"

type Item = { label: string; href?: string }

export const Breadcrumbs = ({ items }: { items: Item[] }) => {
  const all: Item[] = [{ label: "トップ", href: "/" }, ...items]
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: all.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href && { item: absoluteUrl(item.href) }),
    })),
  }
  return (
    <nav className="breadcrumbs" aria-label="パンくずリスト">
      <ol>
        {all.map((item, i) => (
          <li key={i}>
            {item.href && i < all.length - 1 ? (
              <Link href={item.href}>{item.label}</Link>
            ) : (
              <span aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }}
      />
    </nav>
  )
}
