import type { Metadata } from "next";
import { SITE, absoluteUrl } from "@/lib/config/site";

type PublicPageInput = {
  title: string;
  description: string;
  path: string;
  index?: boolean;
};

export function publicPageMetadata({
  title,
  description,
  path,
  index = true,
}: PublicPageInput): Metadata {
  const url = absoluteUrl(path);
  const fullTitle = path === "/" ? title : `${title} · ${SITE.name}`;

  return {
    title: path === "/" ? { absolute: title } : title,
    description,
    alternates: {
      canonical: url,
    },
    robots: index
      ? { index: true, follow: true }
      : { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: SITE.locale,
      url,
      siteName: SITE.brand,
      title: fullTitle,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
    },
  };
}

export const privatePageRobots: Metadata["robots"] = {
  index: false,
  follow: false,
  nocache: true,
};
