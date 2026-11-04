import Link from "next/link"
import { ReactNode } from "react"
import { siteName, siteNameEn, siteTagline } from "@/lib/site"

export const navItems = [
  { href: "/events/", label: "開催中" },
  { href: "/events/this-weekend/", label: "今週末" },
  { href: "/events/upcoming/", label: "これから" },
  { href: "/articles/", label: "新着記事" },
  { href: "/areas/", label: "エリア" },
  { href: "/search/", label: "検索" },
]

export const Header = () => (
  <header className="site-header">
    <div className="site-header__inner">
      <Link href="/" className="site-logo" aria-label={`${siteName} トップ`}>
        <span className="site-logo__en">{siteNameEn.toUpperCase()}</span>
        <span className="site-logo__ja">{siteName}</span>
      </Link>
      <p className="site-header__tagline">{siteTagline}</p>
    </div>
    <nav className="site-nav" aria-label="メインメニュー">
      <ul className="site-nav__list">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="site-nav__link">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  </header>
)

export const Main = ({ children }: { children: ReactNode }) => (
  <main className="site-main">{children}</main>
)

export const Footer = () => (
  <footer className="site-footer">
    <div className="site-footer__inner">
      <p className="site-footer__logo">{siteNameEn.toUpperCase()}</p>
      <ul className="site-footer__links">
        {navItems.map((item) => (
          <li key={item.href}>
            <Link href={item.href}>{item.label}</Link>
          </li>
        ))}
        <li>
          <Link href="/tags/">タグ一覧</Link>
        </li>
        <li>
          <Link href="/about/">このサイトについて</Link>
        </li>
        <li>
          <Link href="/privacy/">プライバシーポリシー</Link>
        </li>
        <li>
          <a href="/rss.xml">RSS</a>
        </li>
      </ul>
      <p className="site-footer__note">
        掲載情報は記事公開時点のものです。最新情報は各公式サイトをご確認ください。
      </p>
      <p className="site-footer__copy">
        &copy; {siteName} / <a href="https://reload.co.jp">Reload Inc.</a>
      </p>
    </div>
  </footer>
)
