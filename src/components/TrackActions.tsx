"use client";

import { useState, type ReactNode } from "react";
import { siteConfig } from "@/lib/config";
import { shareLink, shareTrackStory, shortVideoUrl, siteTrackUrl } from "@/lib/share";
import type { UploadedVideo } from "@/lib/youtube";

type Props = {
  video: UploadedVideo;
};

function IconButton({
  onClick,
  href,
  label,
  children,
}: {
  onClick?: () => void;
  href?: string;
  label: string;
  children: ReactNode;
}) {
  const className =
    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-muted transition hover:bg-surface-strong hover:text-foreground";

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className} aria-label={label} title={label}>
        {children}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className} aria-label={label} title={label}>
      {children}
    </button>
  );
}

/** Rangée d'actions (J'aime / Partager / Story) partagée entre le panneau
 * "en cours de lecture" et la page individuelle d'un morceau. */
export default function TrackActions({ video }: Props) {
  const [shareFeedback, setShareFeedback] = useState<string | null>(null);
  const [storyFeedback, setStoryFeedback] = useState<string | null>(null);
  const watchUrl = shortVideoUrl(video.id);

  async function handleShare() {
    const result = await shareLink(
      {
        title: video.title,
        text: `🎧 ${video.title} — musique composée par IA. Écoute-la sur ${siteConfig.name} :`,
        url: siteTrackUrl(video.id),
      },
      "track_share",
    );
    if (result === "copied") {
      setShareFeedback("Copié !");
      setTimeout(() => setShareFeedback(null), 2000);
    }
  }

  async function handleStory() {
    setStoryFeedback("…");
    const result = await shareTrackStory(video, siteConfig);
    setStoryFeedback(result === "downloaded" ? "Téléchargé" : result === "failed" ? "Échec" : null);
    if (result !== "shared") {
      setTimeout(() => setStoryFeedback(null), 2000);
    }
  }

  return (
    <div className="-mx-1 flex items-center gap-0.5 border-t border-line pt-1">
      <IconButton href={watchUrl} label="Aimer sur YouTube">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M12 21s-6.7-4.35-9.3-8.1C.8 10.1 1.4 6.6 4.4 5.1c2.2-1.1 4.6-.3 6.1 1.4l1.5 1.7 1.5-1.7c1.5-1.7 3.9-2.5 6.1-1.4 3 1.5 3.6 5 1.7 7.8C18.7 16.65 12 21 12 21z" />
        </svg>
        <span className="text-xs">J&apos;aime</span>
      </IconButton>
      <IconButton onClick={handleShare} label="Partager ce morceau">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 1 0-3-3c0 .24.04.47.09.7L7.04 9.81A2.99 2.99 0 0 0 5 9a3 3 0 1 0 0 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a2.92 2.92 0 1 0 3.92-2.92z" />
        </svg>
        <span className="text-xs">{shareFeedback ?? "Partager"}</span>
      </IconButton>
      <IconButton onClick={handleStory} label="Partager en story">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <rect x="5" y="2" width="14" height="20" rx="3" strokeWidth="1.6" className="fill-none stroke-current" />
          <circle cx="12" cy="18" r="1.3" />
        </svg>
        <span className="text-xs">{storyFeedback ?? "Story"}</span>
      </IconButton>
    </div>
  );
}
