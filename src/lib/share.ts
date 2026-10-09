import type { UploadedVideo } from "@/lib/youtube";

/**
 * Étiquette les liens partagés en story pour pouvoir mesurer, dans les
 * journaux Cloudflare ou un outil d'analytics, ce que ce canal ramène.
 */
function withStoryUtm(url: string): string {
  try {
    const u = new URL(url);
    u.searchParams.set("utm_source", "story");
    u.searchParams.set("utm_medium", "social");
    u.searchParams.set("utm_campaign", "partage");
    return u.toString();
  } catch {
    return url;
  }
}

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const attempt = current ? `${current} ${word}` : word;
    if (ctx.measureText(attempt).width > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = attempt;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** URL courte officielle YouTube, plus lisible qu'un lien watch?v= complet. */
export function shortVideoUrl(videoId: string): string {
  return `https://youtu.be/${videoId}`;
}

/**
 * On ne peut pas extraire 15 secondes du fichier audio/vidéo réel d'une
 * vidéo YouTube : ce serait un téléchargement automatisé du contenu, qui
 * viole les conditions d'utilisation de YouTube (même pour ses propres
 * vidéos), et capturer l'audio d'un lecteur intégré est bloqué par les
 * règles de sécurité cross-origin. À la place, le lien de la story démarre
 * directement à ce moment de la vidéo, pour donner un extrait.
 */
const STORY_CLIP_START_SECONDS = 30;

function formatTimestamp(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/**
 * Lien vers la page dédiée du morceau sur notre propre site (au lieu d'un
 * lien direct vers YouTube), pour que les partages ramènent vers la
 * vitrine — avec un aperçu Open Graph riche — plutôt que de shunter
 * directement vers YouTube. `t` démarre la lecture à un instant précis.
 */
export function siteTrackUrl(videoId: string, t?: number): string {
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const query = t ? `?t=${t}` : "";
  return `${origin}/m/${videoId}${query}`;
}

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Instagram (et Snapchat/TikTok) recouvrent le haut et le bas d'une story
 * avec leur propre interface (profil, réponse, stickers) : tout le contenu
 * essentiel doit rester dans cette "zone sûre" pour ne jamais être masqué.
 * Repères officiels ~250px en haut / ~250px en bas sur une image 1080x1920.
 */
const SAFE_TOP = 260;
const SAFE_BOTTOM = STORY_HEIGHT - 300;

function roundedClip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.clip();
}

/**
 * Génère une image verticale (format story Instagram/Snapchat, 1080x1920)
 * pour un morceau : vignette YouTube + titre + branding du site, avec tout
 * le texte contenu dans la zone sûre (non recouverte par l'UI d'Instagram).
 * La vignette est chargée via notre proxy interne (/api/thumbnail-proxy)
 * pour éviter de "tainter" le canvas (i.ytimg.com n'envoie pas d'en-têtes
 * CORS permissifs).
 */
export async function generateStoryImage(
  video: UploadedVideo,
  site: { name: string; tagline: string },
): Promise<Blob | null> {
  // Sans attendre les polices, le premier rendu canvas peut utiliser une
  // police de repli et décaler le texte.
  await document.fonts?.ready;

  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT);
  bg.addColorStop(0, "#171717");
  bg.addColorStop(1, "#0a0a0a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  const thumbTop = SAFE_TOP;
  const thumbHeight = STORY_WIDTH * (9 / 16) - 40;

  try {
    const img = await loadImage(`/api/thumbnail-proxy?id=${video.id}`);
    const scale = Math.max(
      (STORY_WIDTH - 40) / img.width,
      thumbHeight / img.height,
    );
    const sw = (STORY_WIDTH - 40) / scale;
    const sh = thumbHeight / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;

    ctx.save();
    roundedClip(ctx, 20, thumbTop, STORY_WIDTH - 40, thumbHeight, 32);
    ctx.drawImage(img, sx, sy, sw, sh, 20, thumbTop, STORY_WIDTH - 40, thumbHeight);
    ctx.fillStyle = "rgba(0,0,0,0.15)";
    ctx.fillRect(20, thumbTop, STORY_WIDTH - 40, thumbHeight);
    ctx.restore();
  } catch {
    // Pas de vignette disponible : un cadre discret marque quand même la zone.
    ctx.strokeStyle = "rgba(255,255,255,0.15)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(20, thumbTop, STORY_WIDTH - 40, thumbHeight, 32);
    ctx.stroke();
  }

  ctx.textAlign = "center";
  const taglineY = thumbTop + thumbHeight + 70;
  ctx.fillStyle = "rgba(255,255,255,0.55)";
  ctx.font = "600 32px Arial";
  ctx.fillText(site.tagline.toUpperCase(), STORY_WIDTH / 2, taglineY);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 62px Arial";
  const titleLines = wrapText(ctx, video.title, STORY_WIDTH - 140).slice(0, 3);
  const titleStartY = taglineY + 90;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, STORY_WIDTH / 2, titleStartY + i * 74);
  });

  const clipLabelY = Math.min(
    titleStartY + titleLines.length * 74 + 70,
    SAFE_BOTTOM - 130,
  );
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 32px Arial";
  ctx.fillText(
    `🎧 ÉCOUTE DÈS ${formatTimestamp(STORY_CLIP_START_SECONDS)} →`,
    STORY_WIDTH / 2,
    clipLabelY,
  );

  const url = siteTrackUrl(video.id).replace(/^https?:\/\//, "");
  ctx.font = "bold 36px Arial";
  const urlWidth = ctx.measureText(url).width;
  const pillPaddingX = 40;
  const pillHeight = 72;
  const pillY = Math.min(clipLabelY + 74, SAFE_BOTTOM - 40);
  const pillX = STORY_WIDTH / 2 - urlWidth / 2 - pillPaddingX;
  const pillW = urlWidth + pillPaddingX * 2;

  ctx.fillStyle = "#dc2626";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY - pillHeight / 2, pillW, pillHeight, pillHeight / 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(url, STORY_WIDTH / 2, pillY + 13);

  ctx.fillStyle = "rgba(255,255,255,0.45)";
  ctx.font = "36px Arial";
  ctx.fillText(site.name, STORY_WIDTH / 2, Math.min(pillY + 90, SAFE_BOTTOM));

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
}

const storyCache = new Map<string, Promise<File | null>>();

/**
 * Génère (une seule fois par morceau) le fichier image de la story. À
 * appeler dès l'affichage du morceau : `navigator.share` exige un geste
 * utilisateur récent, et générer l'image après le clic (chargement de la
 * vignette + rendu canvas) peut dépasser ce délai sur mobile et faire
 * échouer le partage.
 */
export function prepareTrackStory(
  video: UploadedVideo,
  site: { name: string; tagline: string },
): Promise<File | null> {
  let pending = storyCache.get(video.id);
  if (!pending) {
    pending = generateStoryImage(video, site)
      .then((blob) =>
        blob ? new File([blob], `${video.id}-story.jpg`, { type: "image/jpeg" }) : null,
      )
      .catch(() => null);
    // Un échec ne doit pas rester en cache : on réessaiera au prochain clic.
    pending.then((file) => {
      if (!file) storyCache.delete(video.id);
    });
    storyCache.set(video.id, pending);
  }
  return pending;
}

export type StoryShareResult = {
  outcome: "shared" | "cancelled" | "downloaded" | "failed";
  /** Lien du morceau copié, à coller en sticker "Lien" dans la story. */
  linkCopied: boolean;
};

/**
 * Partage l'image "story" d'un morceau via la feuille de partage native
 * (Instagram/Snapchat/WhatsApp Story sur mobile).
 *
 * - Seul le fichier est partagé : Instagram et d'autres apps ignorent ou
 *   refusent un partage qui mélange image + texte/lien.
 * - Le lien (avec instant de départ et UTM) est copié dans le presse-papiers
 *   juste avant, pour être collé en sticker "Lien" dans la story.
 * - Sans partage de fichiers (desktop), l'image est téléchargée.
 */
export async function shareTrackStory(
  video: UploadedVideo,
  site: { name: string; tagline: string },
): Promise<StoryShareResult> {
  const url = withStoryUtm(siteTrackUrl(video.id, STORY_CLIP_START_SECONDS));
  const [file, linkCopied] = await Promise.all([
    prepareTrackStory(video, site),
    copyToClipboard(url),
  ]);
  if (!file) return { outcome: "failed", linkCopied };

  if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: video.title });
      return { outcome: "shared", linkCopied };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { outcome: "cancelled", linkCopied };
      }
      // Autre échec (geste expiré, app refusant le fichier) : téléchargement.
    }
  }

  const objectUrl = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${video.title.replace(/[^\w-]+/g, "-")}.jpg`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Laisse au navigateur le temps de démarrer le téléchargement.
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  return { outcome: "downloaded", linkCopied };
}
