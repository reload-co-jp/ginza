import { buildNewsSitemapXml } from "@/lib/news-sitemap"
import { xmlResponse } from "@/lib/xml"

export const dynamic = "force-static"

export const GET = () => xmlResponse(buildNewsSitemapXml())
