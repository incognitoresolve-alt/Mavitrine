"use client";

import { useState } from "react";

type Props = {
  title: string;
  repeat: boolean;
  onToggleRepeat: () => void;
  onPrev: () => void;
  onNext: () => void;
  onClose: () => void;
  hasPrev: boolean;
  hasNext: boolean;
};

export default function MiniPlayer({
  title,
  repeat,
  onToggleRepeat,
  onPrev,
  onNext,
  onClose,
  hasPrev,
  hasNext,
}: Props) {
  const [expanded, setExpanded] = useState(true);

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        aria-label="Afficher les contrôles de lecture"
        className="fixed bottom-5 left-1/2 z-50 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full bg-red-600 text-white shadow-lg shadow-black/30 transition hover:bg-red-500"
        style={{ marginBottom: "env(safe-area-inset-bottom)" }}
      >
        <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
          <path d="M9 18V5l12-2v13" strokeWidth="1.6" className="fill-none stroke-current" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="6" cy="18" r="3" />
          <circle cx="18" cy="16" r="3" />
        </svg>
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-5 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-1 rounded-full border border-line bg-background/95 py-2 pl-4 pr-2 text-foreground shadow-lg shadow-black/30 backdrop-blur"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      <p className="mr-1 min-w-0 flex-1 truncate text-sm font-medium">{title}</p>

      <button
        type="button"
        onClick={onPrev}
        disabled={!hasPrev}
        aria-label="Morceau précédent"
        title="Morceau précédent"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-surface-strong disabled:opacity-30"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onNext}
        disabled={!hasNext}
        aria-label="Morceau suivant"
        title="Morceau suivant"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground transition hover:bg-surface-strong disabled:opacity-30"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M16 6h2v12h-2zM6 6l8.5 6L6 18z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onToggleRepeat}
        aria-label="Répéter ce morceau"
        title="Répéter ce morceau"
        aria-pressed={repeat}
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition ${
          repeat ? "bg-red-600 text-white" : "text-foreground hover:bg-surface-strong"
        }`}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M7 7h10a3 3 0 0 1 3 3v1h-2v-1a1 1 0 0 0-1-1H7v2.5L3 8l4-3.5V7zm10 10H7a3 3 0 0 1-3-3v-1h2v1a1 1 0 0 0 1 1h10v-2.5l4 3.5-4 3.5V17z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={() => setExpanded(false)}
        aria-label="Réduire"
        title="Réduire"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-faint transition hover:bg-surface-strong"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M6 10l6 6 6-6z" />
        </svg>
      </button>

      <button
        type="button"
        onClick={onClose}
        aria-label="Arrêter la lecture"
        title="Arrêter la lecture"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-faint transition hover:bg-surface-strong"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
          <path d="M6.4 4.98 4.98 6.4 10.59 12l-5.61 5.6 1.42 1.42L12 13.4l5.6 5.61 1.4-1.4L13.4 12l5.61-5.6-1.42-1.42L12 10.59z" />
        </svg>
      </button>
    </div>
  );
}
