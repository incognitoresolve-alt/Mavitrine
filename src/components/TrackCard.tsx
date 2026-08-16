"use client";

import { useState } from "react";
import { formatCompact, formatDate, formatFull } from "@/lib/format";
import type { UploadedVideo } from "@/lib/youtube";

type Props = {
  video: UploadedVideo;
  viewCount: number | null;
};

export default function TrackCard({ video, viewCount }: Props) {
  const [playing, setPlaying] = useState(false);
  const thumbnail = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-white/20">
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
            href={`https://www.youtube.com/watch?v=${video.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline-offset-2 hover:underline"
          >
            Voir sur YouTube
          </a>
        </div>
      </div>
    </article>
  );
}
