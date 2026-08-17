import { siteConfig } from "@/lib/config";

const API_BASE = "https://www.googleapis.com/youtube/v3";

export type ChannelStats = {
  subscriberCount: number | null;
  subscriberCountHidden: boolean;
  viewCount: number;
  videoCount: number;
  title: string;
  thumbnailUrl: string | null;
};

export type VideoStats = {
  id: string;
  viewCount: number;
  likeCount: number | null;
  durationSeconds: number;
};

export type UploadedVideo = {
  id: string;
  title: string;
  publishedAt: string;
};

function isConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY && siteConfig.youtubeChannelId);
}

/**
 * L'ID de la playlist "uploads" (toutes les vidéos publiques d'une chaîne)
 * se déduit de l'ID de chaîne en remplaçant le préfixe "UC" par "UU" —
 * convention YouTube, aucun appel API supplémentaire nécessaire.
 */
function uploadsPlaylistId(channelId: string): string {
  return `UU${channelId.slice(2)}`;
}

/**
 * Récupère les statistiques de la chaîne (abonnés, vues totales, nb vidéos).
 * Renvoie `null` si la clé API / l'ID de chaîne ne sont pas configurés, ou
 * si l'appel échoue, pour ne jamais casser le rendu de la page.
 */
export async function getChannelStats(): Promise<ChannelStats | null> {
  if (!isConfigured()) return null;

  const url = new URL(`${API_BASE}/channels`);
  url.searchParams.set("part", "statistics,snippet");
  url.searchParams.set("id", siteConfig.youtubeChannelId);
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const channel = data.items?.[0];
    if (!channel) return null;

    const stats = channel.statistics;
    return {
      subscriberCount: stats.hiddenSubscriberCount
        ? null
        : Number(stats.subscriberCount),
      subscriberCountHidden: Boolean(stats.hiddenSubscriberCount),
      viewCount: Number(stats.viewCount ?? 0),
      videoCount: Number(stats.videoCount ?? 0),
      title: channel.snippet?.title ?? siteConfig.name,
      thumbnailUrl: channel.snippet?.thumbnails?.medium?.url ?? null,
    };
  } catch {
    return null;
  }
}

/**
 * Récupère les vidéos publiques de la chaîne (playlist "uploads"), triées
 * de la plus récente à la plus ancienne. C'est la source de vérité de la
 * page d'accueil : toute nouvelle vidéo publiée sur la chaîne apparaît
 * automatiquement, sans intervention manuelle. Renvoie un tableau vide si
 * la clé API n'est pas configurée ou en cas d'erreur.
 */
export async function getChannelUploads(
  maxResults = 50,
): Promise<UploadedVideo[]> {
  if (!isConfigured()) return [];

  const url = new URL(`${API_BASE}/playlistItems`);
  url.searchParams.set("part", "snippet");
  url.searchParams.set(
    "playlistId",
    uploadsPlaylistId(siteConfig.youtubeChannelId),
  );
  url.searchParams.set("maxResults", String(maxResults));
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY!);

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return [];

    const data = await res.json();
    const videos: UploadedVideo[] = (data.items ?? [])
      .filter((item: { snippet?: { resourceId?: { videoId?: string } } }) =>
        Boolean(item.snippet?.resourceId?.videoId),
      )
      .map(
        (item: {
          snippet: {
            resourceId: { videoId: string };
            title: string;
            publishedAt: string;
          };
        }) => ({
          id: item.snippet.resourceId.videoId,
          title: item.snippet.title,
          publishedAt: item.snippet.publishedAt,
        }),
      );

    return videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  } catch {
    return [];
  }
}

/** Convertit une durée ISO 8601 (ex: "PT1M30S") en secondes. */
function parseIsoDuration(iso: string | undefined): number {
  if (!iso) return 0;
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const [, h, m, s] = match;
  return Number(h ?? 0) * 3600 + Number(m ?? 0) * 60 + Number(s ?? 0);
}

/**
 * L'API YouTube ne signale pas explicitement qu'une vidéo est un Short : on
 * utilise la convention courante (≤ 60 secondes) pour les filtrer de la
 * vitrine, qui n'a vocation à montrer que les morceaux complets.
 */
export function isShortDuration(durationSeconds: number): boolean {
  return durationSeconds > 0 && durationSeconds <= 60;
}

/**
 * Récupère le nombre de vues / likes / la durée pour une liste d'IDs de
 * vidéos YouTube. Renvoie une Map vide si la clé API n'est pas configurée
 * ou en cas d'erreur.
 */
export async function getVideoStats(
  videoIds: string[],
): Promise<Map<string, VideoStats>> {
  const results = new Map<string, VideoStats>();
  if (!process.env.YOUTUBE_API_KEY || videoIds.length === 0) return results;

  const url = new URL(`${API_BASE}/videos`);
  url.searchParams.set("part", "statistics,contentDetails");
  url.searchParams.set("id", videoIds.join(","));
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return results;

    const data = await res.json();
    for (const item of data.items ?? []) {
      results.set(item.id, {
        id: item.id,
        viewCount: Number(item.statistics?.viewCount ?? 0),
        likeCount:
          item.statistics?.likeCount !== undefined
            ? Number(item.statistics.likeCount)
            : null,
        durationSeconds: parseIsoDuration(item.contentDetails?.duration),
      });
    }
  } catch {
    // On renvoie ce qu'on a (rien), la page reste utilisable sans stats.
  }

  return results;
}

export type VideoInfo = UploadedVideo & {
  viewCount: number;
  durationSeconds: number;
};

/**
 * Récupère titre, date et statistiques d'une seule vidéo à partir de son
 * ID — utilisé par les pages individuelles de morceau (/m/[id]), pour
 * générer les métadonnées Open Graph et afficher le lecteur sans avoir à
 * recharger toute la liste des vidéos de la chaîne. Renvoie `null` si la
 * clé API n'est pas configurée, si la vidéo n'existe pas, ou en cas
 * d'erreur.
 */
export async function getVideoInfo(videoId: string): Promise<VideoInfo | null> {
  if (!process.env.YOUTUBE_API_KEY) return null;

  const url = new URL(`${API_BASE}/videos`);
  url.searchParams.set("part", "snippet,statistics,contentDetails");
  url.searchParams.set("id", videoId);
  url.searchParams.set("key", process.env.YOUTUBE_API_KEY);

  try {
    const res = await fetch(url, { next: { revalidate: 600 } });
    if (!res.ok) return null;

    const data = await res.json();
    const item = data.items?.[0];
    if (!item) return null;

    return {
      id: item.id,
      title: item.snippet?.title ?? "",
      publishedAt: item.snippet?.publishedAt ?? "",
      viewCount: Number(item.statistics?.viewCount ?? 0),
      durationSeconds: parseIsoDuration(item.contentDetails?.duration),
    };
  } catch {
    return null;
  }
}
