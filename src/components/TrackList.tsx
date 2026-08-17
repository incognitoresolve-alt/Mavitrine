"use client";

import { useMemo, useState } from "react";
import MiniPlayer from "@/components/MiniPlayer";
import NowPlaying from "@/components/NowPlaying";
import TrackGridItem from "@/components/TrackGridItem";
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
  const [repeat, setRepeat] = useState(false);
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

  const playingIndex = sorted.findIndex((t) => t.id === playingId);
  const playingTrack = playingIndex >= 0 ? sorted[playingIndex] : null;

  function selectTrack(id: string) {
    setPlayingId(id);
    requestAnimationFrame(() => {
      document.getElementById("now-playing")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  function handleEnded(id: string) {
    if (!continuousPlay) return;
    const index = sorted.findIndex((t) => t.id === id);
    const next = sorted[index + 1];
    setPlayingId(next ? next.id : null);
  }

  function goPrev() {
    if (playingIndex > 0) setPlayingId(sorted[playingIndex - 1].id);
  }

  function goNext() {
    if (playingIndex >= 0 && playingIndex < sorted.length - 1) {
      setPlayingId(sorted[playingIndex + 1].id);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-4 px-1 text-sm">
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

      {playingTrack && (
        <NowPlaying
          video={playingTrack}
          viewCount={playingTrack.viewCount}
          repeat={repeat}
          onEnded={() => handleEnded(playingTrack.id)}
          onClose={() => setPlayingId(null)}
        />
      )}

      <div className="grid grid-cols-3 gap-0.5 pb-24 sm:gap-1">
        {sorted.map((track) => (
          <div key={track.id} id={`track-${track.id}`} className="scroll-mt-4">
            <TrackGridItem
              video={track}
              viewCount={track.viewCount}
              active={playingId === track.id}
              onSelect={() => selectTrack(track.id)}
            />
          </div>
        ))}
      </div>

      {playingTrack && (
        <MiniPlayer
          title={playingTrack.title}
          repeat={repeat}
          onToggleRepeat={() => setRepeat((r) => !r)}
          onPrev={goPrev}
          onNext={goNext}
          onClose={() => setPlayingId(null)}
          hasPrev={playingIndex > 0}
          hasNext={playingIndex >= 0 && playingIndex < sorted.length - 1}
        />
      )}
    </div>
  );
}
