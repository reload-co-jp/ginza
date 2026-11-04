"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { filterEntries, type SearchEntry } from "@/lib/search"

export const SearchBox = ({ entries }: { entries: SearchEntry[] }) => {
  const [query, setQuery] = useState("")

  // 静的出力なので ?q= はクライアント側で読む
  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("q")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (q) setQuery(q)
  }, [])

  const results = useMemo(() => filterEntries(entries, query), [entries, query])

  return (
    <div className="search">
      <form
        role="search"
        className="search__form"
        onSubmit={(e) => {
          e.preventDefault()
          const url = new URL(window.location.href)
          url.searchParams.set("q", query)
          window.history.replaceState(null, "", url)
        }}
      >
        <input
          type="search"
          name="q"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="例：イルミネーション、GINZA SIX、無料"
          aria-label="記事を検索"
          className="search__input"
        />
        <button type="submit" className="search__button">
          検索
        </button>
      </form>
      {query.trim() !== "" && (
        <p className="search__count" aria-live="polite">
          「{query}」の検索結果：{results.length}件
        </p>
      )}
      <ul className="search__results">
        {results.map((entry) => (
          <li key={entry.slug} className="search__item">
            <Link href={`/articles/${entry.slug}/`} className="search__link">
              <img
                src={entry.image.src}
                alt={entry.image.alt}
                className="search__thumb"
                loading="lazy"
                decoding="async"
              />
              <span>
                <span className="search__title">{entry.title}</span>
                <span className="search__meta">
                  {entry.venue ? `${entry.venue} / ` : ""}
                  {entry.publishedAt.replace(/-/g, ".")}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
