"use client";

import { useEffect, useState } from "react";
import { formatCompact, formatFull } from "@/lib/format";
import type { ChannelStats } from "@/lib/youtube";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

type ApiResponse =
  | ({ configured: true } & ChannelStats)
  | { configured: false; message?: string };

type Props = {
  initialStats: ChannelStats | null;
};

function Stat({ value, label, title }: { value: string; label: string; title?: string }) {
  return (
    <div className="flex-1 text-center" title={title}>
      <p className="text-lg font-semibold tabular-nums sm:text-xl">{value}</p>
      <p className="text-xs text-muted sm:text-sm">{label}</p>
    </div>
  );
}

export default function ProfileStats({ initialStats }: Props) {
  const [stats, setStats] = useState<ChannelStats | null>(initialStats);
  const [configured, setConfigured] = useState(initialStats !== null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      try {
        const res = await fetch("/api/youtube-stats", { cache: "no-store" });
        const data: ApiResponse = await res.json();
        if (cancelled) return;

        if (data.configured) {
          setStats(data);
          setConfigured(true);
        } else {
          setConfigured(false);
        }
      } catch {
        // Silencieux : on garde les dernières stats connues.
      }
    }

    const interval = setInterval(poll, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!configured || !stats) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line-strong px-4 py-3 text-center text-xs text-muted">
        Statistiques non configurées (
        <code className="rounded bg-surface-strong px-1">YOUTUBE_API_KEY</code>)
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center">
      <Stat value={formatCompact(stats.videoCount)} label="Vidéos" title={formatFull(stats.videoCount)} />
      <Stat
        value={
          stats.subscriberCountHidden || stats.subscriberCount === null
            ? "Privé"
            : formatCompact(stats.subscriberCount)
        }
        label="Abonnés"
        title={stats.subscriberCount !== null ? formatFull(stats.subscriberCount) : undefined}
      />
      <Stat value={formatCompact(stats.viewCount)} label="Vues" title={formatFull(stats.viewCount)} />
    </div>
  );
}
