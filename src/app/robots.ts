import type { MetadataRoute } from "next";
import { PRIVATE_PATH_PREFIXES, absoluteUrl, getSiteUrl } from "@/lib/config/site";

export default function robots(): MetadataRoute.Robots {
  const site = new URL(getSiteUrl());

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [...PRIVATE_PATH_PREFIXES],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: site.host,
  };
}
