import type { Metadata } from "next"
import Script from "next/script"
import { Footer, Header, Main } from "@/components/elements/layout"
import { jsonLdScript } from "@/lib/json-ld"
import {
  absoluteUrl,
  siteDescription,
  siteName,
  siteNameEn,
  siteUrl,
} from "@/lib/site"
import "./globals.css"

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: `${siteName}｜銀座のイベント・最新情報`,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  alternates: {
    canonical: "/",
    types: { "application/rss+xml": "/rss.xml" },
  },
  openGraph: {
    siteName,
    locale: "ja_JP",
    type: "website",
    images: [{ url: "/images/og.png", width: 1200, height: 630 }],
  },
  twitter: { card: "summary_large_image" },
  robots: {
    index: true,
    follow: true,
    googleBot: { "max-image-preview": "large", "max-snippet": -1 },
  },
}

const siteJsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": absoluteUrl("/#website"),
    url: absoluteUrl("/"),
    name: siteName,
    alternateName: siteNameEn,
    inLanguage: "ja",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: absoluteUrl("/search/?q={search_term_string}"),
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": absoluteUrl("/#organization"),
    name: siteName,
    url: absoluteUrl("/"),
    logo: absoluteUrl("/icon.svg"),
  },
]

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="ja">
    <body>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd) }}
      />
      <a href="#content" className="skip-link">
        本文へスキップ
      </a>
      <Header />
      <Main>{children}</Main>
      <Footer />
      <Script
        async
        crossOrigin="anonymous"
        src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6542845006087970"
        strategy="afterInteractive"
      />
    </body>
  </html>
)

export default RootLayout
