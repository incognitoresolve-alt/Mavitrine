import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Image OG générée pour l'accueil (aucune image statique nécessaire). */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background: "linear-gradient(180deg, #171717 0%, #0a0a0a 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            width: 96,
            height: 96,
            borderRadius: 48,
            background: "#dc2626",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 48,
          }}
        >
          🎧
        </div>
        <div style={{ fontSize: 64, fontWeight: 700 }}>{siteConfig.name}</div>
        <div style={{ fontSize: 32, color: "rgba(255,255,255,0.65)" }}>
          {siteConfig.tagline}
        </div>
      </div>
    ),
    { ...size },
  );
}
