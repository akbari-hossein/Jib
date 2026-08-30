import type { MetadataRoute } from "next";
import { PUBLIC_PATHS, absoluteUrl } from "@/lib/config/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  return PUBLIC_PATHS.map((path) => ({
    url: absoluteUrl(path),
    lastModified: now,
    changeFrequency: path === "/" ? "weekly" : "monthly",
    priority: path === "/" ? 1 : path === "/features" || path === "/pricing" ? 0.8 : 0.6,
  }));
}
