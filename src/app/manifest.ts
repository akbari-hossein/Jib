import type { MetadataRoute } from "next";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/config/app";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${APP_NAME} — مدیریت پول شخصی`,
    short_name: APP_NAME,
    description: APP_DESCRIPTION,
    start_url: "/home",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "fa",
    dir: "rtl",
    background_color: "#F5F2EA",
    theme_color: "#2A3A4F",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
