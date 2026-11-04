import { afterEach, describe, expect, it, vi } from "vitest"
import {
  addDays,
  daysBetween,
  formatDateRange,
  formatJaDate,
  getToday,
  getWeekendRange,
} from "./date"

describe("getToday", () => {
  afterEach(() => vi.unstubAllEnvs())

  it("returns the JST date", () => {
    vi.stubEnv("GINZA_TODAY", "")
    // 2026-11-04 16:00 UTC = 2026-11-05 01:00 JST
    expect(getToday(new Date("2026-11-04T16:00:00Z"))).toBe("2026-11-05")
  })

  it("can be overridden by GINZA_TODAY", () => {
    vi.stubEnv("GINZA_TODAY", "2026-12-24")
    expect(getToday()).toBe("2026-12-24")
  })
})

describe("date helpers", () => {
  it("adds days across months", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01")
  })

  it("counts days between dates", () => {
    expect(daysBetween("2026-11-04", "2026-11-09")).toBe(5)
  })

  it("formats Japanese dates with weekday", () => {
    expect(formatJaDate("2026-11-04")).toBe("11月4日（水）")
    expect(formatJaDate("2026-11-04", true)).toBe("2026年11月4日（水）")
  })

  it("adds the year to the end date only across years", () => {
    expect(formatDateRange("2026-11-18", "2026-12-25")).toBe(
      "2026年11月18日（水） 〜 12月25日（金）"
    )
    expect(formatDateRange("2026-11-14", "2027-02-14")).toBe(
      "2026年11月14日（土） 〜 2027年2月14日（日）"
    )
  })
})

describe("getWeekendRange", () => {
  it("returns the coming Saturday and Sunday on weekdays", () => {
    expect(getWeekendRange("2026-11-04")).toEqual({
      start: "2026-11-07",
      end: "2026-11-08",
    })
  })

  it("returns the current weekend on Saturday and Sunday", () => {
    expect(getWeekendRange("2026-11-07")).toEqual({
      start: "2026-11-07",
      end: "2026-11-08",
    })
    expect(getWeekendRange("2026-11-08")).toEqual({
      start: "2026-11-07",
      end: "2026-11-08",
    })
  })
})
