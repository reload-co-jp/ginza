export type SearchEntry = {
  slug: string
  title: string
  summary: string
  publishedAt: string
  venue?: string
  tags: string[]
  image: { src: string; alt: string }
  /** 検索対象テキスト（小文字化済み）。 */
  text: string
}

export const normalize = (s: string) => s.normalize("NFKC").toLowerCase()

/** 空白区切りの全語を含むエントリ（AND検索）。 */
export const filterEntries = (
  entries: SearchEntry[],
  query: string
): SearchEntry[] => {
  const words = normalize(query).split(/\s+/).filter(Boolean)
  if (words.length === 0) return []
  return entries.filter((e) => words.every((w) => e.text.includes(w)))
}
