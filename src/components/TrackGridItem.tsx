"use client";

import { useState } from "react";
import { formatCompact } from "@/lib/format";
import type { UploadedVideo } from "@/lib/youtube";
import { loadYouTubeIframeApi } from "@/lib/youtubePlayer";

type Props = {
  video: UploadedVideo;
  viewCount: number | null;
  isNew: boolean;
  active: boolean;
  onSelect: () => void;
};

const EQ_DELAYS = ["0ms", "-300ms", "-600ms"];

export default function TrackGridItem({ video, viewCount, isNew, active, onSelect }: Props) {
  // mqdefault : 16:9 natif (320x180, ~10 Ko), sans les bandes noires
  // incrustées dans hqdefault (4:3).
  const thumbnail = `https://i.ytimg.com/vi/${video.id}/mqdefault.jpg`;
  const [loaded, setLoaded] = useState(false);

  return (
    <button
      type="button"
      onClick={onSelect}
      // Intention de lecture : précharge l'API YouTube avant le clic.
      onPointerEnter={() => void loadYouTubeIframeApi()}
      onTouchStart={() => void loadYouTubeIframeApi()}
      onFocus={() => void loadYouTubeIframeApi()}
      aria-label={`Lire ${video.title}`}
      aria-pressed={active}
      className="group relative aspect-square w-full overflow-hidden bg-surface-strong focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
    >
      {!loaded && <span className="absolute inset-0 animate-pulse bg-surface-strong" aria-hidden="true" />}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail}
        alt=""
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => setLoaded(true)}
        className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${
          loaded ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Dégradé de lisibilité pour le titre et les vues. */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent"
      />

      {isNew && (
        <span className="absolute left-1 top-1 rounded bg-red-600 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
          Nouveau
        </span>
      )}

      {viewCount !== null && (
        <span className="absolute right-1 top-1 flex items-center gap-0.5 rounded bg-black/55 px-1.5 py-0.5 text-[10px] font-semibold text-white">
          <svg viewBox="0 0 24 24" className="h-2.5 w-2.5 fill-current" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
          {formatCompact(viewCount)}
        </span>
      )}

      <span className="absolute inset-x-0 bottom-0 flex items-end gap-1 p-1.5 text-left">
        {active && (
          <span className="mb-0.5 flex h-3 shrink-0 items-end gap-[2px]" aria-hidden="true">
            {EQ_DELAYS.map((delay) => (
              <span key={delay} className="eq-bar h-full w-[3px] rounded-sm bg-red-500" style={{ animationDelay: delay }} />
            ))}
          </span>
        )}
        <span className="line-clamp-2 text-[11px] font-semibold leading-tight text-white drop-shadow sm:text-xs">
          {video.title}
        </span>
      </span>

      {active && (
        <span className="pointer-events-none absolute inset-0 border-2 border-red-600" aria-hidden="true" />
      )}
      {active && <span className="sr-only">(en cours de lecture)</span>}
    </button>
  );
}
