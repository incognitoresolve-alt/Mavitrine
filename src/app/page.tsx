import ShareButton from "@/components/ShareButton";
import StatsBar from "@/components/StatsBar";
import ThemeToggle from "@/components/ThemeToggle";
import TrackDropdownNav from "@/components/TrackDropdownNav";
import TrackList from "@/components/TrackList";
import { siteConfig } from "@/lib/config";
import { getChannelStats, getChannelUploads, getVideoStats } from "@/lib/youtube";

// Rendu à chaque requête plutôt que figé au moment du build : les secrets
// Cloudflare (YOUTUBE_API_KEY) ne sont garantis disponibles qu'à l'exécution
// du Worker, pas pendant l'étape de build. Le cache reste assuré par les
// `fetch` vers l'API YouTube (revalidate: 600 dans src/lib/youtube.ts).
export const dynamic = "force-dynamic";

export default async function Home() {
  const uploads = await getChannelUploads();
  const [channelStats, videoStats] = await Promise.all([
    getChannelStats(),
    getVideoStats(uploads.map((v) => v.id)),
  ]);

  return (
    <div className="flex-1 bg-background text-foreground dark:bg-gradient-to-b dark:from-neutral-950 dark:via-neutral-950 dark:to-neutral-900">
      <header className="relative mx-auto flex max-w-5xl flex-col items-center gap-6 px-4 pb-10 pt-12 text-center sm:px-6 sm:pt-24">
        <div className="absolute right-4 top-4 sm:right-6 sm:top-6">
          <ThemeToggle />
        </div>

        <p className="text-sm font-medium uppercase tracking-[0.2em] text-faint">
          {siteConfig.tagline}
        </p>
        <h1 className="text-4xl font-bold sm:text-5xl">{siteConfig.name}</h1>
        <p className="max-w-xl text-muted">{siteConfig.description}</p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          {siteConfig.youtubeChannelUrl && (
            <a
              href={siteConfig.youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                <path d="M8 5v14l11-7z" />
              </svg>
              S&apos;abonner sur YouTube
            </a>
          )}
          <ShareButton
            target={{
              title: siteConfig.name,
              text: siteConfig.description,
            }}
            label="Partager la vitrine"
          />
        </div>

        <div className="mt-4 w-full">
          <StatsBar initialStats={channelStats} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 pb-24 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold">Morceaux</h2>
          <TrackDropdownNav
            tracks={uploads.map((v) => ({ id: v.id, title: v.title }))}
          />
        </div>
        {uploads.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line-strong px-5 py-4 text-sm text-muted">
            Aucune vidéo trouvée. Vérifiez que{" "}
            <code className="rounded bg-surface-strong px-1 py-0.5">YOUTUBE_API_KEY</code>{" "}
            est bien configurée, ou revenez après votre prochaine publication
            YouTube : les morceaux apparaissent ici automatiquement.
          </p>
        ) : (
          <TrackList
            tracks={uploads.map((video) => ({
              ...video,
              viewCount: videoStats.get(video.id)?.viewCount ?? null,
            }))}
          />
        )}
      </main>

      <footer className="border-t border-line px-6 py-8 text-center text-sm text-faint">
        <p>
          {siteConfig.name} — musiques générées par IA. Statistiques fournies
          par l&apos;API YouTube Data.
        </p>
      </footer>
    </div>
  );
}
