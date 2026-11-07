import { describe, expect, it } from "vitest"
import { jsonLdScript, toOffer, toPostalAddress } from "./json-ld"

describe("jsonLdScript", () => {
  it("escapes < so the script tag cannot be closed", () => {
    expect(jsonLdScript({ a: "</script>" })).toBe('{"a":"\\u003c/script>"}')
  })
})

describe("toPostalAddress", () => {
  it("splits prefecture, city and street", () => {
    expect(toPostalAddress("東京都中央区銀座6-10-1")).toEqual({
      "@type": "PostalAddress",
      addressRegion: "東京都",
      addressLocality: "中央区",
      streetAddress: "銀座6-10-1",
      addressCountry: "JP",
    })
  })

  it("keeps building names in streetAddress", () => {
    expect(
      toPostalAddress("東京都千代田区有楽町2-7-1 有楽町マルイ8F")
    ).toMatchObject({
      addressLocality: "千代田区",
      streetAddress: "有楽町2-7-1 有楽町マルイ8F",
    })
  })

  it("falls back to streetAddress when the format is unknown", () => {
    expect(toPostalAddress("銀座4丁目")).toEqual({
      "@type": "PostalAddress",
      streetAddress: "銀座4丁目",
      addressCountry: "JP",
    })
  })
})

describe("toOffer", () => {
  const url = "https://example.com/"

  it("uses the first yen amount", () => {
    expect(toOffer("前売2,000円、当日2,400円", url)).toEqual({
      "@type": "Offer",
      price: 2000,
      priceCurrency: "JPY",
      url,
    })
  })

  it("treats free admission as 0 yen", () => {
    expect(toOffer("入場無料（商品は有料）", url)?.price).toBe(0)
  })

  it("returns undefined when no price can be read", () => {
    expect(toOffer("屋外・観覧自由", url)).toBeUndefined()
  })
})
