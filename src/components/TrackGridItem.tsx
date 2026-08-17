"use client";

import { formatCompact } from "@/lib/format";
import type { UploadedVideo } from "@/lib/youtube";

type Props = {
  video: UploadedVideo;
  viewCount: number | null;
  active: boolean;
  onSelect: () => void;
};

export default function TrackGridItem({ video, viewCount, active, onSelect }: Props) {
  const thumbnail = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;

  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={`Lire ${video.title}`}
      aria-pressed={active}
      className="group relative aspect-square w-full overflow-hidden bg-black"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail}
        alt={video.title}
        className="h-full w-full object-cover transition group-hover:scale-105"
        loading="lazy"
      />
      <span
        className={`absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/0 text-white opacity-0 transition group-hover:bg-black/40 group-hover:opacity-100 ${
          active ? "bg-black/50 opacity-100" : ""
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-7 w-7 fill-current drop-shadow">
          <path d="M8 5v14l11-7z" />
        </svg>
        {viewCount !== null && (
          <span className="text-xs font-semibold drop-shadow">
            {formatCompact(viewCount)} vues
          </span>
        )}
      </span>
      {active && (
        <span className="absolute inset-0 border-2 border-red-600" aria-hidden="true" />
      )}
    </button>
  );
}
