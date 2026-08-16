import StatsBar from "@/components/StatsBar";
import TrackCard from "@/components/TrackCard";
import { tracks } from "@/data/tracks";
import { siteConfig } from "@/lib/config";
import { getChannelStats, getVideoStats } from "@/lib/youtube";

export default async function Home() {
  const [channelStats, videoStats] = await Promise.all([
    getChannelStats(),
    getVideoStats(tracks.map((t) => t.youtubeId)),
  ]);

  const sortedTracks = [...tracks].sort((a, b) =>
    (b.releaseDate ?? "").localeCompare(a.releaseDate ?? ""),
  );

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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sortedTracks.map((track) => (
            <TrackCard
              key={track.id}
              track={track}
              viewCount={videoStats.get(track.youtubeId)?.viewCount ?? null}
            />
          ))}
        </div>
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
