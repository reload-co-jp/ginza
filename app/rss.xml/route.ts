import { buildRssFeedXml } from "@/lib/feeds"
import { xmlResponse } from "@/lib/xml"

export const dynamic = "force-static"

export const GET = () => xmlResponse(buildRssFeedXml())
