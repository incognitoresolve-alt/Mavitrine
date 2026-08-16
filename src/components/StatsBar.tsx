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

function StatCard({
  label,
  value,
  title,
}: {
  label: string;
  value: string;
  title?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-2 py-3 text-center backdrop-blur sm:px-5 sm:py-4">
      <p
        className="text-lg font-semibold tabular-nums sm:text-2xl md:text-3xl"
        title={title}
      >
        {value}
      </p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-white/60 sm:text-xs">
        {label}
      </p>
    </div>
  );
}

export default function StatsBar({ initialStats }: Props) {
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
      <div className="rounded-xl border border-dashed border-white/20 px-5 py-4 text-sm text-white/60">
        Statistiques YouTube non configurées. Ajoutez{" "}
        <code className="rounded bg-white/10 px-1 py-0.5">YOUTUBE_API_KEY</code>{" "}
        et{" "}
        <code className="rounded bg-white/10 px-1 py-0.5">YOUTUBE_CHANNEL_ID</code>{" "}
        dans votre fichier <code className="rounded bg-white/10 px-1 py-0.5">.env.local</code>{" "}
        pour afficher les abonnés et les vues en direct.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:gap-4">
      <StatCard
        label="Abonnés"
        value={
          stats.subscriberCountHidden || stats.subscriberCount === null
            ? "Privé"
            : formatCompact(stats.subscriberCount)
        }
        title={
          stats.subscriberCount !== null
            ? formatFull(stats.subscriberCount)
            : undefined
        }
      />
      <StatCard
        label="Vues totales"
        value={formatCompact(stats.viewCount)}
        title={formatFull(stats.viewCount)}
      />
      <StatCard
        label="Vidéos"
        value={formatCompact(stats.videoCount)}
        title={formatFull(stats.videoCount)}
      />
    </div>
  );
}
