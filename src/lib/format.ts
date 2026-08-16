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
