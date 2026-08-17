import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { headers } from "next/headers";
import TrackActions from "@/components/TrackActions";
import ThemeToggle from "@/components/ThemeToggle";
import { formatCompact, formatDate, formatFull } from "@/lib/format";
import { siteConfig } from "@/lib/config";
import { getVideoInfo } from "@/lib/youtube";

// Rendu à chaque requête : les secrets Cloudflare (YOUTUBE_API_KEY) ne sont
// garantis disponibles qu'à l'exécution du Worker (voir src/app/page.tsx).
export const dynamic = "force-dynamic";

type Params = { id: string };
type SearchParams = { t?: string };

async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return host ? `${proto}://${host}` : "";
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await getVideoInfo(id);
  if (!video) return { title: siteConfig.name };

  const origin = await requestOrigin();
  const thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
  const title = `${video.title} — ${siteConfig.name}`;
  const description = `Écoutez « ${video.title} » sur ${siteConfig.name}, ${siteConfig.tagline.toLowerCase()}.`;

  return {
    title,
    description,
    openGraph: {
      title: video.title,
      description,
      url: origin ? `${origin}/m/${id}` : undefined,
      siteName: siteConfig.name,
      type: "video.other",
      images: [{ url: thumbnail, width: 480, height: 360 }],
    },
    twitter: {
      card: "summary_large_image",
      title: video.title,
      description,
      images: [thumbnail],
    },
  };
}

export default async function TrackPage({
  params,
  searchParams,
}: {
  params: Promise<Params>;
  searchParams: Promise<SearchParams>;
}) {
  const { id } = await params;
  const { t } = await searchParams;
  const video = await getVideoInfo(id);
  if (!video) notFound();

  const startSeconds = t ? Number(t) : undefined;
  const embedSrc = `https://www.youtube.com/embed/${id}?autoplay=1${
    startSeconds ? `&start=${startSeconds}` : ""
  }`;

  const origin = await requestOrigin();
  const breadcrumbStructuredData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: siteConfig.name, item: origin || undefined },
      { "@type": "ListItem", position: 2, name: video.title },
    ],
  };

  return (
    <div className="mx-auto flex min-h-full max-w-2xl flex-1 flex-col bg-background text-foreground">
      <div className="flex items-center justify-between border-b border-line px-4 py-3">
        <Link href="/" className="text-base font-semibold">
          {siteConfig.name}
        </Link>
        <ThemeToggle />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbStructuredData) }}
      />

      <main className="flex-1 p-4 sm:p-6">
        <nav aria-label="Fil d'Ariane" className="mb-3 flex items-center gap-1.5 text-xs text-faint">
          <Link href="/" className="hover:text-foreground hover:underline">
            {siteConfig.name}
          </Link>
          <span aria-hidden="true">/</span>
          <span className="truncate text-muted" title={video.title}>
            {video.title}
          </span>
        </nav>

        <div className="overflow-hidden rounded-2xl border border-line bg-surface">
          <div className="aspect-video w-full bg-black">
            <iframe
              className="h-full w-full"
              src={embedSrc}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex flex-col gap-2 p-4">
            <h1 className="break-words text-lg font-semibold leading-snug">{video.title}</h1>
            <p className="text-xs text-faint">{formatDate(video.publishedAt)}</p>
            <p className="text-xs text-faint" title={formatFull(video.viewCount)}>
              {formatCompact(video.viewCount)} vues
            </p>

            <TrackActions video={video} />
          </div>
        </div>

        {siteConfig.youtubeChannelUrl && (
          <a
            href={siteConfig.youtubeChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white">
              <path d="M8 5v14l11-7z" />
            </svg>
            S&apos;abonner pour ne rater aucun morceau
          </a>
        )}

        <Link
          href="/"
          className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-foreground"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M20 11H7.83l4.88-4.88a1 1 0 1 0-1.42-1.41l-6.58 6.58a1 1 0 0 0 0 1.42l6.58 6.58a1 1 0 0 0 1.42-1.42L7.83 13H20a1 1 0 0 0 0-2z" />
          </svg>
          Tous les morceaux sur {siteConfig.name}
        </Link>
      </main>
    </div>
  );
}
