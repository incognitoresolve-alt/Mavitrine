"use client";

import { useEffect, useState, type ReactNode } from "react";
import { siteConfig } from "@/lib/config";
import { prepareTrackStory, shareTrackStory, shortVideoUrl } from "@/lib/share";
import type { UploadedVideo } from "@/lib/youtube";

type Props = {
  video: UploadedVideo;
};

function IconButton({
  onClick,
  disabled,
  href,
  label,
  children,
}: {
  onClick?: () => void;
  disabled?: boolean;
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
    <button type="button" onClick={onClick} disabled={disabled} className={`${className} disabled:opacity-60`} aria-label={label} title={label}>
      {children}
    </button>
  );
}

const FEEDBACK_MS = 3000;

/** Rangée d'actions (J'aime / Story) partagée entre le panneau "en cours de
 * lecture" et la page individuelle d'un morceau. */
export default function TrackActions({ video }: Props) {
  const [storyFeedback, setStoryFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const watchUrl = shortVideoUrl(video.id);

  // Prépare l'image dès l'affichage pour que le partage parte instantanément
  // au clic (le geste utilisateur reste valable pour la feuille de partage).
  useEffect(() => {
    void prepareTrackStory(video, siteConfig);
  }, [video]);

  async function handleStory() {
    if (busy) return;
    setBusy(true);
    setStoryFeedback("…");
    const { outcome, linkCopied } = await shareTrackStory(video, siteConfig);
    setBusy(false);
    const messages: Record<typeof outcome, string | null> = {
      shared: linkCopied ? "Lien copié : colle-le en sticker" : null,
      cancelled: null,
      downloaded: linkCopied ? "Image téléchargée, lien copié" : "Image téléchargée",
      failed: "Échec",
    };
    setStoryFeedback(messages[outcome]);
    if (messages[outcome]) setTimeout(() => setStoryFeedback(null), FEEDBACK_MS);
  }

  return (
    <div className="-mx-1 flex items-center gap-0.5 border-t border-line pt-1">
      <IconButton href={watchUrl} label="Aimer sur YouTube">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M12 21s-6.7-4.35-9.3-8.1C.8 10.1 1.4 6.6 4.4 5.1c2.2-1.1 4.6-.3 6.1 1.4l1.5 1.7 1.5-1.7c1.5-1.7 3.9-2.5 6.1-1.4 3 1.5 3.6 5 1.7 7.8C18.7 16.65 12 21 12 21z" />
        </svg>
        <span className="text-xs">J&apos;aime</span>
      </IconButton>
      <IconButton onClick={handleStory} disabled={busy} label="Partager en story">
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <rect x="5" y="2" width="14" height="20" rx="3" strokeWidth="1.6" className="fill-none stroke-current" />
          <circle cx="12" cy="18" r="1.3" />
        </svg>
        <span className="text-xs" aria-live="polite">{storyFeedback ?? "Partager en story"}</span>
      </IconButton>
    </div>
  );
}
