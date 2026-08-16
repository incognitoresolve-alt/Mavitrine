"use client";

import { useState } from "react";
import { shareLink, type ShareTarget } from "@/lib/share";

type Props = {
  target: ShareTarget;
  label?: string;
  className?: string;
};

export default function ShareButton({
  target,
  label = "Partager",
  className,
}: Props) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function handleClick() {
    const result = await shareLink(target);
    if (result === "copied") {
      setFeedback("Lien copié !");
      setTimeout(() => setFeedback(null), 2000);
    } else if (result === "failed") {
      setFeedback("Échec du partage");
      setTimeout(() => setFeedback(null), 2000);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        "inline-flex items-center gap-2 rounded-full border border-line-strong px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-strong"
      }
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
        <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81a3 3 0 1 0-3-3c0 .24.04.47.09.7L7.04 9.81A2.99 2.99 0 0 0 5 9a3 3 0 1 0 0 6c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65a2.92 2.92 0 1 0 3.92-2.92z" />
      </svg>
      {feedback ?? label}
    </button>
  );
}
