import type { MetadataRoute } from "next";
import { SITE_URL } from "./constant";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/clean-all"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
