/**
 * <script type="application/ld+json"> 埋め込み用のシリアライズ。
 * "</script>" で タグが閉じないよう "<" をエスケープする。
 */
export const jsonLdScript = (data: unknown): string =>
  JSON.stringify(data).replace(/</g, "\\u003c")
