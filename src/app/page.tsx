import StatsBar from "@/components/StatsBar";
import TrackCard from "@/components/TrackCard";
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
    <div className="flex-1 bg-gradient-to-b from-neutral-950 via-neutral-950 to-neutral-900 text-white">
      <header className="mx-auto flex max-w-5xl flex-col items-center gap-6 px-6 pb-10 pt-16 text-center sm:pt-24">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-white/50">
          {siteConfig.tagline}
        </p>
        <h1 className="text-4xl font-bold sm:text-5xl">{siteConfig.name}</h1>
        <p className="max-w-xl text-white/70">{siteConfig.description}</p>

        {siteConfig.youtubeChannelUrl && (
          <a
            href={siteConfig.youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-6 py-2.5 text-sm font-semibold transition hover:bg-red-500"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
            S&apos;abonner sur YouTube
          </a>
        )}

        <div className="mt-4 w-full">
          <StatsBar initialStats={channelStats} />
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        <h2 className="mb-6 text-xl font-semibold">Morceaux</h2>
        {uploads.length === 0 ? (
          <p className="rounded-xl border border-dashed border-white/20 px-5 py-4 text-sm text-white/60">
            Aucune vidéo trouvée. Vérifiez que{" "}
            <code className="rounded bg-white/10 px-1 py-0.5">YOUTUBE_API_KEY</code>{" "}
            est bien configurée, ou revenez après votre prochaine publication
            YouTube : les morceaux apparaissent ici automatiquement.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {uploads.map((video) => (
              <TrackCard
                key={video.id}
                video={video}
                viewCount={videoStats.get(video.id)?.viewCount ?? null}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 px-6 py-8 text-center text-sm text-white/40">
        <p>
          {siteConfig.name} — musiques générées par IA. Statistiques fournies
          par l&apos;API YouTube Data.
        </p>
      </footer>
    </div>
  );
}
