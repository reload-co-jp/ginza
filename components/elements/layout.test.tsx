import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Footer, Header, Main, navItems } from "./layout"

describe("Header", () => {
  it("renders the logo link and navigation", () => {
    render(<Header />)
    expect(
      screen.getByRole("link", { name: "銀座Now トップ" })
    ).toHaveAttribute("href", "/")
    const nav = screen.getByRole("navigation", { name: "メインメニュー" })
    expect(nav.querySelectorAll("a")).toHaveLength(navItems.length)
  })
})

describe("Main", () => {
  it("renders children inside a main element", () => {
    render(
      <Main>
        <span>body</span>
      </Main>
    )
    expect(screen.getByRole("main")).toHaveTextContent("body")
  })
})

describe("Footer", () => {
  it("renders the copyright and policy link", () => {
    render(<Footer />)
    expect(screen.getByRole("contentinfo")).toHaveTextContent("© 銀座Now")
    expect(
      screen.getByRole("link", { name: "プライバシーポリシー" })
    ).toHaveAttribute("href", expect.stringMatching(/^\/privacy\/?$/))
  })
})
