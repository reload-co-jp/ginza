/**
 * <script type="application/ld+json"> 埋め込み用のシリアライズ。
 * "</script>" で タグが閉じないよう "<" をエスケープする。
 */
export const jsonLdScript = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, "\\u003c")

/**
 * 「東京都中央区銀座6-10-1」を schema.org の PostalAddress に分解する。
 * 都道府県・市区町村が読み取れない住所は streetAddress にそのまま入れる。
 */
export const toPostalAddress = (address: string) => {
  const m = address.match(
    /^(東京都|北海道|(?:京都|大阪)府|.{2,3}県)(.+?[区市町村])(.+)$/
  )
  return {
    "@type": "PostalAddress",
    ...(m
      ? { addressRegion: m[1], addressLocality: m[2], streetAddress: m[3] }
      : { streetAddress: address }),
    addressCountry: "JP",
  }
}

/**
 * event.price の表示テキストから Offer を作る。
 * 金額（「2,000円」）があれば最初の金額、なければ「無料」で 0 円。
 * どちらも読み取れない場合（「屋外・観覧自由」など）は undefined。
 */
export const toOffer = (price: string, url: string) => {
  const yen = price.match(/([\d,]+)\s*円/)
  const amount = yen
    ? Number(yen[1].replace(/,/g, ""))
    : /無料/.test(price)
      ? 0
      : undefined
  if (amount === undefined || Number.isNaN(amount)) return undefined
  return {
    "@type": "Offer",
    price: amount,
    priceCurrency: "JPY",
    url,
  }
}
