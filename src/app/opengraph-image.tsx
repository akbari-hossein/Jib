import { ImageResponse } from "next/og";
import { APP_NAME, APP_NAME_EN } from "@/lib/config/app";

export const alt = "جیب — بدون، امروز چقدر می‌تونی خرج کنی";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadFont() {
  const url =
    "https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/fonts/ttf/Vazirmatn-SemiBold.ttf";
  const response = await fetch(url);
  if (!response.ok) {
    return null;
  }
  return response.arrayBuffer();
}

export default async function OpenGraphImage() {
  const fontData = await loadFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "#F5F2EA",
          color: "#1C2430",
          direction: "rtl",
          fontFamily: fontData ? "Vazirmatn" : "sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 36, fontWeight: 600 }}>{APP_NAME}</div>
          <div style={{ fontSize: 28, opacity: 0.45 }}>{APP_NAME_EN}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ fontSize: 72, fontWeight: 600, lineHeight: 1.2 }}>
            بدون، امروز چقدر می‌تونی خرج کنی.
          </div>
          <div style={{ fontSize: 32, opacity: 0.62, lineHeight: 1.5, maxWidth: 880 }}>
            مدیریت پول شخصی برای تومان و تقویم شمسی — بدون حسابداری.
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "Vazirmatn",
              data: fontData,
              weight: 600,
              style: "normal",
            },
          ]
        : [],
    },
  );
}
