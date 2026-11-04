import type { MetadataRoute } from "next"
import { absoluteUrl, siteUrl } from "@/lib/site"

export const dynamic = "force-static"

const robots = (): MetadataRoute.Robots => ({
  rules: [{ userAgent: "*", allow: "/" }],
  sitemap: [absoluteUrl("/sitemap.xml"), absoluteUrl("/news-sitemap.xml")],
  host: siteUrl,
})

export default robots
