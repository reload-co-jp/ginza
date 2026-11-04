import { describe, expect, it } from "vitest"
import { filterEntries, normalize, type SearchEntry } from "./search"

const entry = (slug: string, text: string): SearchEntry => ({
  slug,
  title: slug,
  summary: "",
  publishedAt: "2026-11-04",
  tags: [],
  image: { src: "", alt: "" },
  text: normalize(text),
})

describe("filterEntries", () => {
  const entries = [
    entry("a", "GINZA SIX クリスマス"),
    entry("b", "銀座三越 グルメ"),
  ]

  it("matches all words (AND)", () => {
    expect(
      filterEntries(entries, "ginza クリスマス").map((e) => e.slug)
    ).toEqual(["a"])
  })

  it("normalizes full-width input", () => {
    expect(filterEntries(entries, "ＧＩＮＺＡ").map((e) => e.slug)).toEqual([
      "a",
    ])
  })

  it("returns nothing for an empty query", () => {
    expect(filterEntries(entries, "  ")).toEqual([])
  })
})
