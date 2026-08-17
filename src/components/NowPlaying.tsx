"use client";

import { useEffect, useRef } from "react";
import { formatCompact, formatDate, formatFull } from "@/lib/format";
import { shortVideoUrl } from "@/lib/share";
import { loadYouTubeIframeApi, type YouTubePlayer } from "@/lib/youtubePlayer";
import type { UploadedVideo } from "@/lib/youtube";
import TrackActions from "@/components/TrackActions";

type Props = {
  video: UploadedVideo;
  viewCount: number | null;
  repeat: boolean;
  onEnded?: () => void;
  onClose: () => void;
};

export default function NowPlaying({ video, viewCount, repeat, onEnded, onClose }: Props) {
  const onEndedRef = useRef(onEnded);
  const repeatRef = useRef(repeat);
  const watchUrl = shortVideoUrl(video.id);
  const iframeId = `yt-player-${video.id}`;

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    let cancelled = false;
    let player: YouTubePlayer | null = null;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !window.YT) return;
      player = new window.YT.Player(iframeId, {
        events: {
          onStateChange: (event) => {
            if (event.data === window.YT!.PlayerState.ENDED) {
              if (repeatRef.current) {
                player?.seekTo(0, true);
                player?.playVideo();
              } else {
                onEndedRef.current?.();
              }
            }
          },
        },
      });
    });

    return () => {
      cancelled = true;
      player?.destroy();
    };
  }, [video.id, iframeId]);

  return (
    <div
      id="now-playing"
      className="mb-6 scroll-mt-4 overflow-hidden rounded-2xl border border-line bg-surface"
    >
      <div className="relative aspect-video w-full bg-black">
        <iframe
          id={iframeId}
          className="h-full w-full"
          src={`https://www.youtube.com/embed/${video.id}?autoplay=1&enablejsapi=1`}
          title={video.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          title="Fermer"
          className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M6.4 4.98 4.98 6.4 10.59 12l-5.61 5.6 1.42 1.42L12 13.4l5.6 5.61 1.4-1.4L13.4 12l5.61-5.6-1.42-1.42L12 10.59z" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <h3 className="break-words font-semibold leading-snug">{video.title}</h3>
        <p className="text-xs text-faint">{formatDate(video.publishedAt)}</p>

        <div className="flex items-center justify-between pt-1 text-xs text-faint">
          <span title={viewCount !== null ? formatFull(viewCount) : undefined}>
            {viewCount !== null ? `${formatCompact(viewCount)} vues` : ""}
          </span>
          <a href={watchUrl} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:underline">
            Voir sur YouTube
          </a>
        </div>

        <TrackActions video={video} />
      </div>
    </div>
  );
}
