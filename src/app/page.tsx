import ProfileStats from "@/components/ProfileStats";
import ShareButton from "@/components/ShareButton";
import ThemeToggle from "@/components/ThemeToggle";
import TrackDropdownNav from "@/components/TrackDropdownNav";
import TrackList from "@/components/TrackList";
import { siteConfig } from "@/lib/config";
import {
  getChannelStats,
  getChannelUploads,
  getVideoStats,
  isShortDuration,
} from "@/lib/youtube";

// Rendu à chaque requête plutôt que figé au moment du build : les secrets
// Cloudflare (YOUTUBE_API_KEY) ne sont garantis disponibles qu'à l'exécution
// du Worker, pas pendant l'étape de build. Le cache reste assuré par les
// `fetch` vers l'API YouTube (revalidate: 600 dans src/lib/youtube.ts).
export const dynamic = "force-dynamic";

export default async function Home() {
  const allUploads = await getChannelUploads();
  const [channelStats, videoStats] = await Promise.all([
    getChannelStats(),
    getVideoStats(allUploads.map((v) => v.id)),
  ]);

  // Les Shorts ne sont pas des morceaux complets : on ne les affiche pas.
  const uploads = allUploads.filter(
    (v) => !isShortDuration(videoStats.get(v.id)?.durationSeconds ?? 0),
  );

  const handle = siteConfig.youtubeChannelUrl.replace(/^https?:\/\/(www\.)?/, "");

  return (
    <div className="mx-auto flex min-h-full max-w-3xl flex-1 flex-col bg-background text-foreground">
      {/* Barre du haut, façon barre de profil Instagram */}
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <span className="text-base font-semibold">{siteConfig.name}</span>
        <ThemeToggle />
      </div>

      <header className="px-4 pb-5 pt-5 sm:px-6">
        <div className="flex items-center gap-5 sm:gap-8">
          {channelStats?.thumbnailUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={channelStats.thumbnailUrl}
              alt={siteConfig.name}
              className="h-20 w-20 shrink-0 rounded-full object-cover ring-2 ring-line sm:h-24 sm:w-24"
            />
          ) : (
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-red-600 ring-2 ring-line sm:h-24 sm:w-24">
              <svg viewBox="0 0 24 24" className="h-9 w-9 fill-white">
                <path d="M9 18V5l12-2v13" strokeWidth="1.6" className="fill-none stroke-white" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="18" r="3" fill="white" />
                <circle cx="18" cy="16" r="3" fill="white" />
              </svg>
            </div>
          )}

          <ProfileStats initialStats={channelStats} />
        </div>

        <div className="mt-4">
          <h1 className="font-bold">{siteConfig.name}</h1>
          <p className="text-sm text-muted">{siteConfig.tagline}</p>
          <p className="mt-1 text-sm">{siteConfig.description}</p>
          {siteConfig.youtubeChannelUrl && (
            <a
              href={siteConfig.youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-sm font-semibold text-blue-500 hover:underline"
            >
              {handle}
            </a>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          {siteConfig.youtubeChannelUrl && (
            <a
              href={siteConfig.youtubeChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
                <path d="M8 5v14l11-7z" />
              </svg>
              S&apos;abonner
            </a>
          )}
          <ShareButton
            target={{ title: siteConfig.name, text: siteConfig.description }}
            label="Partager"
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-line-strong px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-surface-strong"
          />
        </div>
      </header>

      {/* Barre d'onglets, façon grille/reels/identifié·e d'Instagram */}
      <div className="flex border-y border-line text-xs font-semibold uppercase tracking-wide text-faint">
        <div className="flex flex-1 items-center justify-center gap-1.5 border-t-2 border-foreground py-3 text-foreground">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h6v6h-6z" />
          </svg>
          Morceaux
        </div>
      </div>

      <main className="flex-1 px-1 pt-4 sm:px-2">
        <div className="mb-3 flex justify-end px-2">
          <TrackDropdownNav tracks={uploads.map((v) => ({ id: v.id, title: v.title }))} />
        </div>

        {uploads.length === 0 ? (
          <p className="mx-3 rounded-xl border border-dashed border-line-strong px-5 py-4 text-sm text-muted">
            Aucune vidéo trouvée. Vérifiez que{" "}
            <code className="rounded bg-surface-strong px-1 py-0.5">YOUTUBE_API_KEY</code>{" "}
            est bien configurée, ou revenez après votre prochaine publication
            YouTube : les morceaux apparaissent ici automatiquement.
          </p>
        ) : (
          <div className="px-2">
            <TrackList
              tracks={uploads.map((video) => ({
                ...video,
                viewCount: videoStats.get(video.id)?.viewCount ?? null,
              }))}
            />
          </div>
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
