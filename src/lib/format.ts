const compactFormatter = new Intl.NumberFormat("fr-FR", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const fullFormatter = new Intl.NumberFormat("fr-FR");

export function formatCompact(n: number): string {
  return compactFormatter.format(n);
}

export function formatFull(n: number): string {
  return fullFormatter.format(n);
}

const dateFormatter = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}

const NEW_TRACK_MS = 7 * 24 * 60 * 60 * 1000;

/** Morceau publié depuis moins de 7 jours (badge "Nouveau"). */
export function isRecent(iso: string, now: number = Date.now()): boolean {
  const published = new Date(iso).getTime();
  return Number.isFinite(published) && now - published < NEW_TRACK_MS;
}
