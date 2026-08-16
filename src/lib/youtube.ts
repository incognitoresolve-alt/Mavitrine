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
};

function isConfigured(): boolean {
  return Boolean(process.env.YOUTUBE_API_KEY && siteConfig.youtubeChannelId);
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
 * Récupère le nombre de vues / likes pour une liste d'IDs de vidéos YouTube.
 * Renvoie une Map vide si la clé API n'est pas configurée ou en cas d'erreur.
 */
export async function getVideoStats(
  videoIds: string[],
): Promise<Map<string, VideoStats>> {
  const results = new Map<string, VideoStats>();
  if (!process.env.YOUTUBE_API_KEY || videoIds.length === 0) return results;

  const url = new URL(`${API_BASE}/videos`);
  url.searchParams.set("part", "statistics");
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
      });
    }
  } catch {
    // On renvoie ce qu'on a (rien), la page reste utilisable sans stats.
  }

  return results;
}
