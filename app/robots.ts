import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/config";

export default function robots(): MetadataRoute.Robots {
  const sitemap = absoluteUrl("/sitemap.xml");
  // /api/ only serves the date picker on the course pages; nothing there is meant for search results.
  return { rules: [{ userAgent: "*", allow: "/", disallow: "/api/" }], ...(sitemap ? { sitemap } : {}) };
}
