"use client";

import type { ChangeEvent } from "react";

type Props = {
  tracks: { id: string; title: string }[];
};

export default function TrackDropdownNav({ tracks }: Props) {
  if (tracks.length === 0) return null;

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const id = e.target.value;
    if (!id) return;
    document
      .getElementById(`track-${id}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
    e.target.value = "";
  }

  return (
    <select
      onChange={handleChange}
      defaultValue=""
      aria-label="Aller à un morceau"
      className="w-full max-w-[220px] rounded-lg border border-white/20 bg-neutral-900 px-3 py-2 text-sm text-white [color-scheme:dark] focus:outline-none focus:ring-2 focus:ring-white/30"
    >
      <option value="" disabled>
        Aller à un morceau…
      </option>
      {tracks.map((track) => (
        <option key={track.id} value={track.id}>
          {track.title}
        </option>
      ))}
    </select>
  );
}
