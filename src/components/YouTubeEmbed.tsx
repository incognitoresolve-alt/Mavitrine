"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { loadYouTubeIframeApi, YT_PLAYER_STATE, type YouTubePlayer } from "@/lib/youtubePlayer";

type Props = {
  videoId: string;
  title: string;
  /** Position de départ en secondes (ex: lien partagé avec un instant précis). */
  start?: number;
  repeat?: boolean;
  onEnded?: () => void;
  /** Contrôles superposés (ex: bouton fermer) rendus par-dessus le lecteur. */
  children?: ReactNode;
  className?: string;
};

// Si le lecteur n'est pas prêt après ce délai (réseau lent, navigateur
// intégré restrictif comme celui d'Instagram/TikTok...), on arrête d'attendre
// indéfiniment et on propose d'ouvrir directement sur YouTube.
const READY_TIMEOUT_MS = 7000;

// Délai laissé au lecteur pour démarrer avec le son avant de considérer que
// le navigateur a bloqué l'autoplay sonore et de basculer en muet.
const AUTOPLAY_SOUND_CHECK_MS = 1500;

/**
 * Lecteur YouTube embarqué : tente de démarrer avec le son (le clic de
 * l'utilisateur qui a sélectionné ce morceau sert de geste autorisant
 * l'autoplay sonore dans la plupart des navigateurs), puis vérifie peu après
 * si la lecture a réellement démarré. Si le son a été bloqué (fréquent dans
 * les navigateurs intégrés comme Instagram/TikTok), on repasse en muet
 * automatiquement — sans quoi le lecteur resterait figé en silence sans
 * qu'on le sache. Un bouton permet de réactiver le son en un tap.
 *
 * Affiche la vignette en fond pendant le chargement (jamais d'écran noir) et
 * une porte de sortie vers YouTube si le lecteur ne démarre toujours pas
 * après quelques secondes.
 *
 * Le composant doit être monté avec `key={videoId}` par l'appelant : un
 * changement de morceau doit repartir d'un état propre (chargement, son),
 * ce qu'un remount garantit nativement plutôt qu'un `useEffect` de reset.
 */
export default function YouTubeEmbed({
  videoId,
  title,
  start,
  repeat = false,
  onEnded,
  children,
  className,
}: Props) {
  const onEndedRef = useRef(onEnded);
  const repeatRef = useRef(repeat);
  const iframeId = `yt-player-${videoId}`;
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const watchUrl = `https://youtu.be/${videoId}`;

  const [status, setStatus] = useState<"loading" | "ready" | "timeout">("loading");
  const [muted, setMuted] = useState(false);
  const playerRef = useRef<YouTubePlayer | null>(null);

  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus((current) => (current === "ready" ? current : "timeout"));
    }, READY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [videoId]);

  useEffect(() => {
    let cancelled = false;
    let player: YouTubePlayer | null = null;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !window.YT) return;
      player = new window.YT.Player(iframeId, {
        events: {
          onReady: (event) => {
            if (cancelled) return;
            playerRef.current = event.target;
            // Lecture déclenchée explicitement (plutôt que de compter
            // uniquement sur `autoplay=1` dans l'URL) : plus fiable dans les
            // navigateurs intégrés qui bloquent souvent l'autoplay déclenché
            // uniquement par un paramètre d'URL.
            event.target.playVideo();
            setStatus("ready");

            window.setTimeout(() => {
              if (cancelled) return;
              const state = playerRef.current?.getPlayerState();
              const isActuallyPlaying =
                state === YT_PLAYER_STATE.PLAYING || state === YT_PLAYER_STATE.BUFFERING;
              if (!isActuallyPlaying) {
                // Le son a été bloqué par le navigateur : on relance en muet
                // plutôt que de laisser le lecteur figé en silence.
                playerRef.current?.mute();
                playerRef.current?.playVideo();
                setMuted(true);
              }
            }, AUTOPLAY_SOUND_CHECK_MS);
          },
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
      playerRef.current = null;
      player?.destroy();
    };
  }, [videoId, iframeId]);

  function handleUnmute() {
    playerRef.current?.unMute();
    playerRef.current?.playVideo();
    setMuted(false);
  }

  return (
    <div className={`relative aspect-video w-full bg-black ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <iframe
        id={iframeId}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          status === "ready" ? "opacity-100" : "opacity-0"
        }`}
        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&playsinline=1&enablejsapi=1${
          start ? `&start=${start}` : ""
        }`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      {status === "loading" && (
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
          <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        </div>
      )}

      {status === "timeout" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60 px-4 text-center">
          <p className="text-sm text-white">La lecture ne démarre pas ici.</p>
          <a
            href={watchUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-500"
          >
            Ouvrir sur YouTube
          </a>
        </div>
      )}

      {status === "ready" && muted && (
        <button
          type="button"
          onClick={handleUnmute}
          aria-label="Activer le son"
          title="Activer le son"
          className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-black/80"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current">
            <path d="M3 10v4h4l5 5V5L7 10H3zm13.5 2A4.5 4.5 0 0 0 15 8.29v7.42A4.5 4.5 0 0 0 16.5 12zM15 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z" />
          </svg>
          Activer le son
        </button>
      )}

      {children}
    </div>
  );
}
