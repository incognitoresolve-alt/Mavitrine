"use client";

import { useMemo, useState } from "react";
import TrackCard from "@/components/TrackCard";
import type { UploadedVideo } from "@/lib/youtube";

type TrackWithViews = UploadedVideo & { viewCount: number | null };
type SortKey = "recent" | "views" | "alpha";

const SORT_LABELS: Record<SortKey, string> = {
  recent: "Plus récent",
  views: "Plus de vues",
  alpha: "Alphabétique",
};

export default function TrackList({ tracks }: { tracks: TrackWithViews[] }) {
  const [sort, setSort] = useState<SortKey>("recent");
  const [continuousPlay, setContinuousPlay] = useState(true);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    const copy = [...tracks];
    if (sort === "views") {
      copy.sort((a, b) => (b.viewCount ?? 0) - (a.viewCount ?? 0));
    } else if (sort === "alpha") {
      copy.sort((a, b) => a.title.localeCompare(b.title, "fr"));
    } else {
      copy.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
    }
    return copy;
  }, [tracks, sort]);

  function handleEnded(id: string) {
    if (!continuousPlay) return;
    const index = sorted.findIndex((t) => t.id === id);
    const next = sorted[index + 1];
    setPlayingId(next ? next.id : null);
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-4 text-sm">
        <label className="flex items-center gap-2 text-muted">
          <input
            type="checkbox"
            checked={continuousPlay}
            onChange={(e) => setContinuousPlay(e.target.checked)}
            className="h-4 w-4 accent-red-600"
          />
          Lecture continue
        </label>

        <label className="flex items-center gap-2 text-muted">
          Trier :
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-line-strong bg-background px-2 py-1 text-sm text-foreground [color-scheme:light] focus:outline-none focus:ring-2 focus:ring-line-strong dark:[color-scheme:dark]"
          >
            {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
              <option key={key} value={key}>
                {SORT_LABELS[key]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {sorted.map((track) => (
          <TrackCard
            key={track.id}
            video={track}
            viewCount={track.viewCount}
            isPlaying={playingId === track.id}
            onPlay={() => setPlayingId(track.id)}
            onEnded={() => handleEnded(track.id)}
          />
        ))}
      </div>
    </div>
  );
}
