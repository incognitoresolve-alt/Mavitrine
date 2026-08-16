"use client";

import { useState, type ReactNode } from "react";
import { formatCompact, formatDate, formatFull } from "@/lib/format";
import { siteConfig } from "@/lib/config";
import { shareLink, shareTrackStory } from "@/lib/share";
import type { UploadedVideo } from "@/lib/youtube";

type Props = {
  video: UploadedVideo;
  viewCount: number | null;
};

function IconButton({
  onClick,
  href,
  label,
  children,
  feedback,
}: {
  onClick?: () => void;
  href?: string;
  label: string;
  children: ReactNode;
  feedback?: string | null;
}) {
  const className =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-white/60 transition hover:bg-white/10 hover:text-white";

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        aria-label={label}
        title={label}
      >
        {children}
        {feedback && <span className="text-xs">{feedback}</span>}
      </a>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label={label}
      title={label}
    >
      {children}
      {feedback && <span className="text-xs">{feedback}</span>}
    </button>
  );
}

export default function TrackCard({ video, viewCount }: Props) {
  const [playing, setPlaying] = useState(false);
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [storyFeedback, setStoryFeedback] = useState<string | null>(null);
  const thumbnail = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
  const watchUrl = `https://www.youtube.com/watch?v=${video.id}`;

  async function handleShare() {
    const result = await shareLink({
      title: video.title,
      text: `${video.title} — ${siteConfig.name}`,
      url: watchUrl,
    });
    if (result === "copied") {
      setShareFeedback("Copié !");
      setTimeout(() => setShareFeedback(null), 2000);
    }
  }

  async function handleStory() {
    setStoryFeedback("…");
    const result = await shareTrackStory(video, siteConfig);
    setStoryFeedback(
      result === "downloaded" ? "Téléchargé" : result === "failed" ? "Échec" : null,
    );
    if (result !== "shared") {
      setTimeout(() => setStoryFeedback(null), 2000);
    }
  }

  return (
    <article
      id={`track-${video.id}`}
      className="group flex scroll-mt-6 flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/20"
    >
      <div className="relative aspect-video w-full bg-black">
        {playing ? (
          <iframe
            className="h-full w-full"
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            className="relative h-full w-full cursor-pointer"
            aria-label={`Lire ${video.title}`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={thumbnail}
              alt={video.title}
              className="h-full w-full object-cover transition group-hover:scale-105"
              loading="lazy"
            />
            <span className="absolute inset-0 flex items-center justify-center bg-black/30 transition group-hover:bg-black/40">
              <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-600 shadow-lg">
                <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-white">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </span>
            </span>
          </button>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="break-words font-semibold leading-snug">{video.title}</h3>
        <p className="text-xs text-white/50">{formatDate(video.publishedAt)}</p>

        <div className="mt-auto flex items-center justify-between pt-2 text-xs text-white/50">
          <span title={viewCount !== null ? formatFull(viewCount) : undefined}>
            {viewCount !== null ? `${formatCompact(viewCount)} vues` : ""}
          </span>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Voir sur YouTube
          </a>
        </div>

        <div className="-mx-1 flex items-center gap-0.5 border-t border-white/10 pt-1">
          <IconButton href={watchUrl} label="Aimer sur YouTube">
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M12 21s-6.7-4.35-9.3-8.1C.8 10.1 1.4 6.6 4.4 5.1c2.2-1.1 4.6-.3 6.1 1.4l1.5 1.7 1.5-1.7c1.5-1.7 3.9-2.5 6.1-1.4 3 1.5 3.6 5 1.7 7.8C18.7 16.65 12 21 12 21z" />
            </svg>
            <span className="text-xs">J&apos;aime</span>
          </IconButton>
          <IconButton
            onClick={handleShare}
            label="Partager ce morceau"
            feedback={shareFeedback}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 1 0-3-3c0 .24.04.47.09.7L7.04 9.81A2.99 2.99 0 0 0 5 9a3 3 0 1 0 0 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a2.92 2.92 0 1 0 3.92-2.92z" />
            </svg>
            <span className="text-xs">{shareFeedback ?? "Partager"}</span>
          </IconButton>
          <IconButton
            onClick={handleStory}
            label="Partager en story"
            feedback={storyFeedback}
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
              <rect x="5" y="2" width="14" height="20" rx="3" strokeWidth="1.6" className="fill-none stroke-current" />
              <circle cx="12" cy="18" r="1.3" />
            </svg>
            <span className="text-xs">{storyFeedback ?? "Story"}</span>
          </IconButton>
        </div>
      </div>
    </article>
  );
}
