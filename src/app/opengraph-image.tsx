import { ImageResponse } from "next/og";
import { siteConfig } from "@/lib/config";
import { formatCompact } from "@/lib/format";
import { getChannelStats, getChannelUploads } from "@/lib/youtube";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = `${siteConfig.name} — ${siteConfig.tagline}`;
// Régénérée au plus une fois par heure : suit les nouvelles publications
// sans solliciter l'API YouTube à chaque aperçu de lien.
export const revalidate = 3600;

const COVER_COUNT = 4;
const FETCH_TIMEOUT_MS = 3000;

/** Vignette en data URI ; null si indisponible (l'image OG reste générée). */
async function fetchCover(videoId: string): Promise<string | null> {
  try {
    const res = await fetch(`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const bytes = new Uint8Array(await res.arrayBuffer());
    let binary = "";
    for (const b of bytes) binary += String.fromCharCode(b);
    return `data:image/jpeg;base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

async function loadData() {
  try {
    const [uploads, stats] = await Promise.all([getChannelUploads(12), getChannelStats()]);
    // Marge de candidats au cas où certaines vignettes seraient indisponibles.
    const ids = uploads.slice(0, COVER_COUNT * 2).map((v) => v.id);
    const covers = (await Promise.all(ids.map(fetchCover)))
      .filter((c): c is string => c !== null)
      .slice(0, COVER_COUNT);
    return { covers, stats };
  } catch {
    return { covers: [] as string[], stats: null };
  }
}

/** Image OG de l'accueil : dernières pochettes + nom du site + statistiques. */
export default async function OpengraphImage() {
  const { covers, stats } = await loadData();
  const statItems = stats
    ? [
        { value: formatCompact(stats.videoCount), label: "morceaux" },
        ...(stats.subscriberCount !== null && !stats.subscriberCountHidden
          ? [{ value: formatCompact(stats.subscriberCount), label: "abonnés" }]
          : []),
        { value: formatCompact(stats.viewCount), label: "vues" },
      ]
    : [];

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "linear-gradient(135deg, #1c1c1c 0%, #0a0a0a 100%)",
          color: "#fff",
          fontFamily: "sans-serif",
          padding: 56,
          gap: 48,
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 88,
              height: 88,
              borderRadius: 44,
              background: "#dc2626",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <svg width="44" height="44" viewBox="0 0 24 24" fill="#fff">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div style={{ fontSize: 68, fontWeight: 700, lineHeight: 1.05 }}>{siteConfig.name}</div>
          <div style={{ fontSize: 32, color: "rgba(255,255,255,0.7)" }}>{siteConfig.tagline}</div>
          {statItems.length > 0 && (
            <div style={{ display: "flex", gap: 36, marginTop: 12 }}>
              {statItems.map((s) => (
                <div key={s.label} style={{ display: "flex", flexDirection: "column" }}>
                  <div style={{ fontSize: 40, fontWeight: 700 }}>{s.value}</div>
                  <div style={{ fontSize: 22, color: "rgba(255,255,255,0.55)" }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {covers.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", width: 520, gap: 12 }}>
            {covers.map((src, i) => (
              <img
                key={i}
                src={src}
                width={254}
                height={254}
                style={{ objectFit: "cover", borderRadius: 16 }}
                alt=""
              />
            ))}
          </div>
        )}
      </div>
    ),
    { ...size },
  );
}
