export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL || "https://ginza.reload.co.jp"
).replace(/\/$/, "")

export const siteName = "銀座Now"
export const siteNameEn = "Ginza Now"

export const siteTagline = "銀座のいま、いちばん新しい楽しみ方を。"

export const siteDescription =
  "銀座・有楽町・日比谷で開催中のイベント、展覧会、ポップアップ、ニューオープンなどの最新情報を、ニュース記事としてわかりやすく届けるメディア"

export const absoluteUrl = (path = "/") => {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`
  return `${siteUrl}${normalizedPath}`
}
