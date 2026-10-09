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
  /** Morceau illisible (supprimé, privé, intégration interdite…). */
  onError?: () => void;
  /** Contrôles superposés (ex: bouton fermer) rendus par-dessus le lecteur. */
  children?: ReactNode;
  className?: string;
};

type Status = "loading" | "ready" | "timeout" | "error";

// Si le lecteur n'est pas prêt après ce délai (réseau lent, navigateur
// intégré restrictif comme celui d'Instagram/TikTok...), on arrête d'attendre
// indéfiniment et on propose d'ouvrir directement sur YouTube.
const READY_TIMEOUT_MS = 7000;

// Délai laissé au lecteur pour démarrer avec le son avant de considérer que
// le navigateur a bloqué l'autoplay sonore et de basculer en muet.
const AUTOPLAY_SOUND_CHECK_MS = 1500;

// Volume par défaut (0-100) appliqué dès que le son est actif.
const DEFAULT_VOLUME = 10;

// Délai avant de passer automatiquement au morceau suivant après une erreur,
// le temps de lire le message.
const ERROR_SKIP_MS = 2500;

/**
 * Lecteur YouTube embarqué, créé une seule fois puis réutilisé : un
 * changement de morceau appelle `loadVideoById()` au lieu de détruire et
 * recréer l'iframe. C'est plus rapide, et surtout l'iframe garde
 * l'autorisation de jouer du son obtenue au premier clic — les morceaux
 * suivants démarrent donc avec le son, même en lecture continue.
 *
 * Si le navigateur bloque l'autoplay sonore (fréquent dans les navigateurs
 * intégrés comme Instagram/TikTok), on repasse en muet et le son revient au
 * prochain geste de l'utilisateur n'importe où sur la page.
 *
 * Une vidéo illisible (codes d'erreur YouTube) affiche un message et
 * déclenche `onError` (ex: passage au morceau suivant) au lieu d'attendre
 * le délai de chargement.
 */
export default function YouTubeEmbed({
  videoId,
  title,
  start,
  repeat = false,
  onEnded,
  onError,
  children,
  className,
}: Props) {
  // L'iframe est créée avec le premier morceau ; les suivants sont chargés
  // via l'API, donc l'URL de l'iframe ne doit plus changer.
  const [initial] = useState(() => ({ videoId, start }));
  const iframeId = `yt-player-${initial.videoId}`;
  const thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  const watchUrl = `https://youtu.be/${videoId}`;

  const [status, setStatus] = useState<Status>("loading");
  const [muted, setMuted] = useState(false);
  const playerRef = useRef<YouTubePlayer | null>(null);
  const enableSoundRef = useRef<() => void>(() => {});
  const checkSoundRef = useRef<() => void>(() => {});
  const loadedIdRef = useRef(initial.videoId);
  const onEndedRef = useRef(onEnded);
  const onErrorRef = useRef(onError);
  const repeatRef = useRef(repeat);

  useEffect(() => {
    onEndedRef.current = onEnded;
    onErrorRef.current = onError;
    repeatRef.current = repeat;
  }, [onEnded, onError, repeat]);

  // Création unique du lecteur.
  useEffect(() => {
    let cancelled = false;
    let player: YouTubePlayer | null = null;
    let soundTimer: number | undefined;
    let removeGestureListeners = () => {};

    function enableSound() {
      removeGestureListeners();
      const p = playerRef.current;
      if (!p) return;
      p.setVolume(DEFAULT_VOLUME);
      p.unMute();
      p.playVideo();
      setMuted(false);
    }

    function checkSound() {
      window.clearTimeout(soundTimer);
      soundTimer = window.setTimeout(() => {
        const p = playerRef.current;
        if (cancelled || !p || p.isMuted()) return;
        const state = p.getPlayerState();
        if (state === YT_PLAYER_STATE.PLAYING || state === YT_PLAYER_STATE.BUFFERING) return;
        // Le son a été bloqué par le navigateur : on relance en muet plutôt
        // que de laisser le lecteur figé en silence, et on réactive le son
        // au prochain geste (tap/clic/touche) qui l'autorise.
        p.mute();
        p.playVideo();
        setMuted(true);
        removeGestureListeners();
        const restore = () => {
          if (!cancelled) enableSound();
        };
        document.addEventListener("pointerdown", restore, { once: true, capture: true });
        document.addEventListener("keydown", restore, { once: true, capture: true });
        removeGestureListeners = () => {
          document.removeEventListener("pointerdown", restore, { capture: true });
          document.removeEventListener("keydown", restore, { capture: true });
        };
      }, AUTOPLAY_SOUND_CHECK_MS);
    }

    enableSoundRef.current = enableSound;
    checkSoundRef.current = checkSound;

    loadYouTubeIframeApi().then(() => {
      if (cancelled || !window.YT) return;
      player = new window.YT.Player(iframeId, {
        events: {
          onReady: (event) => {
            if (cancelled) return;
            const p = event.target;
            playerRef.current = p;
            p.setVolume(DEFAULT_VOLUME);
            p.unMute();
            // Le morceau a pu changer pendant le chargement de l'API.
            if (loadedIdRef.current !== initial.videoId) {
              p.loadVideoById({ videoId: loadedIdRef.current });
            } else {
              // Lecture déclenchée explicitement : plus fiable que le seul
              // `autoplay=1` dans les navigateurs intégrés.
              p.playVideo();
            }
            setStatus((s) => (s === "error" ? s : "ready"));
            checkSound();
          },
          onStateChange: (event) => {
            if (event.data !== YT_PLAYER_STATE.ENDED) return;
            if (repeatRef.current) {
              player?.seekTo(0, true);
              player?.playVideo();
            } else {
              onEndedRef.current?.();
            }
          },
          onError: () => {
            if (cancelled) return;
            setStatus("error");
          },
        },
      });
    });

    return () => {
      cancelled = true;
      window.clearTimeout(soundTimer);
      removeGestureListeners();
      enableSoundRef.current = () => {};
      checkSoundRef.current = () => {};
      playerRef.current = null;
      player?.destroy();
    };
    // Lecteur créé une seule fois pour toute la durée de vie du composant.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Changement de morceau : réutilise le lecteur existant.
  useEffect(() => {
    if (loadedIdRef.current === videoId) return;
    loadedIdRef.current = videoId;
    const p = playerRef.current;
    if (!p) return; // pas encore prêt : onReady chargera le bon morceau
    setStatus("ready");
    p.loadVideoById({ videoId, startSeconds: start });
    checkSoundRef.current();
  }, [videoId, start]);

  // Délai de chargement : uniquement tant que le lecteur n'a jamais démarré.
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setStatus((s) => (s === "loading" ? "timeout" : s));
    }, READY_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, []);

  // Erreur de lecture : passage automatique au suivant après un court délai.
  useEffect(() => {
    if (status !== "error") return;
    const timer = window.setTimeout(() => onErrorRef.current?.(), ERROR_SKIP_MS);
    return () => window.clearTimeout(timer);
  }, [status, videoId]);

  const showOverlayThumb = status !== "ready";

  return (
    <div className={`relative aspect-video w-full bg-black ${className ?? ""}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={thumbnail}
        alt=""
        aria-hidden="true"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover"
      />

      <iframe
        id={iframeId}
        className={`absolute inset-0 h-full w-full transition-opacity duration-300 ${
          showOverlayThumb ? "opacity-0" : "opacity-100"
        }`}
        src={`https://www.youtube.com/embed/${initial.videoId}?autoplay=1&playsinline=1&enablejsapi=1${
          initial.start ? `&start=${initial.start}` : ""
        }`}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />

      <div aria-live="polite" className="contents">
        {status === "loading" && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/30">
            <span className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span className="sr-only">Chargement…</span>
          </div>
        )}

        {(status === "timeout" || status === "error") && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-4 text-center">
            <p className="text-sm text-white">
              {status === "error"
                ? onError
                  ? "Morceau indisponible ici — passage au suivant…"
                  : "Ce morceau ne peut pas être lu ici."
                : "La lecture ne démarre pas ici."}
            </p>
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
      </div>

      {status === "ready" && muted && (
        <button
          type="button"
          onClick={() => enableSoundRef.current()}
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
