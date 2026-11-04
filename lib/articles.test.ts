import { describe, expect, it } from "vitest"
import {
  type ArticleEvent,
  getAllArticles,
  getArticleBySlug,
  getEventBadge,
  getEventStatus,
  getOngoingEvents,
  getRelatedArticles,
  getSeoTitle,
  getUpcomingEvents,
} from "./articles"

const event = (startDate: string, endDate: string): ArticleEvent => ({
  venue: "会場",
  startDate,
  endDate,
  price: "無料",
  reservation: false,
})

describe("getAllArticles", () => {
  it("sorts by publishedAt descending", () => {
    const dates = getAllArticles().map((a) => a.publishedAt)
    expect(dates).toEqual([...dates].sort().reverse())
  })
})

describe("event status", () => {
  it("classifies upcoming, ongoing and ended", () => {
    const e = event("2026-11-10", "2026-11-20")
    expect(getEventStatus(e, "2026-11-09")).toBe("upcoming")
    expect(getEventStatus(e, "2026-11-10")).toBe("ongoing")
    expect(getEventStatus(e, "2026-11-20")).toBe("ongoing")
    expect(getEventStatus(e, "2026-11-21")).toBe("ended")
  })

  it("builds badges", () => {
    const e = event("2026-11-10", "2026-11-20")
    expect(getEventBadge(e, "2026-11-09")).toBe("明日から")
    expect(getEventBadge(e, "2026-11-05")).toBe("5日後に開始")
    expect(getEventBadge(e, "2026-11-10")).toBe("開催中")
    expect(getEventBadge(e, "2026-11-15")).toBe("あと5日")
    expect(getEventBadge(e, "2026-11-20")).toBe("本日まで")
    expect(getEventBadge(e, "2026-11-21")).toBe("終了")
  })
})

describe("event lists", () => {
  it("returns ongoing events sorted by end date", () => {
    const events = getOngoingEvents("2026-11-20")
    expect(events.length).toBeGreaterThan(0)
    for (const a of events) {
      expect(a.event.startDate <= "2026-11-20").toBe(true)
      expect(a.event.endDate >= "2026-11-20").toBe(true)
    }
    const ends = events.map((a) => a.event.endDate)
    expect(ends).toEqual([...ends].sort())
  })

  it("returns upcoming events sorted by start date", () => {
    const events = getUpcomingEvents("2026-11-04")
    expect(events.every((a) => a.event.startDate > "2026-11-04")).toBe(true)
    const starts = events.map((a) => a.event.startDate)
    expect(starts).toEqual([...starts].sort())
  })
})

describe("getSeoTitle", () => {
  it("prefixes 【銀座】 only when the title has no area name", () => {
    const article = getAllArticles()[0]
    expect(getSeoTitle({ ...article, seoTitle: "銀座の夜景" })).toBe(
      "銀座の夜景"
    )
    expect(getSeoTitle({ ...article, seoTitle: "MAPPA EXPO" })).toBe(
      "【銀座】MAPPA EXPO"
    )
  })
})

describe("getRelatedArticles", () => {
  it("excludes the article itself", () => {
    const article = getArticleBySlug("ginza-six-xmas-2026")!
    const related = getRelatedArticles(article)
    expect(related.length).toBeGreaterThan(0)
    expect(related.some((a) => a.slug === article.slug)).toBe(false)
  })
})
