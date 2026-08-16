import type { UploadedVideo } from "@/lib/youtube";

export type ShareTarget = {
  title: string;
  text?: string;
  /** Si omise, utilise l'URL de la page actuelle. */
  url?: string;
};

async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Partage un lien via la feuille de partage native (mobile), ou copie
 * l'URL dans le presse-papiers en repli (desktop / navigateurs non
 * compatibles). Renvoie comment le partage s'est déroulé, pour afficher un
 * message adapté ("copié !" par exemple).
 */
export async function shareLink(
  target: ShareTarget,
): Promise<"shared" | "copied" | "failed"> {
  const url =
    target.url ?? (typeof window !== "undefined" ? window.location.href : "");
  const payload = { ...target, url };

  if (typeof navigator !== "undefined" && navigator.share) {
    try {
      await navigator.share(payload);
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return "shared";
      }
      // Repli sur la copie si le partage natif échoue pour une autre raison.
    }
  }

  return (await copyToClipboard(url)) ? "copied" : "failed";
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

async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Génère une image verticale (format story, 1080x1920) pour un morceau :
 * vignette YouTube + titre + branding du site. La vignette est chargée via
 * notre proxy interne (/api/thumbnail-proxy) pour éviter de "tainter" le
 * canvas (i.ytimg.com n'envoie pas d'en-têtes CORS permissifs).
 */
export async function generateStoryImage(
  video: UploadedVideo,
  site: { name: string; tagline: string },
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  const bg = ctx.createLinearGradient(0, 0, 0, STORY_HEIGHT);
  bg.addColorStop(0, "#0a0a0a");
  bg.addColorStop(1, "#171717");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, STORY_WIDTH, STORY_HEIGHT);

  try {
    const img = await loadImage(`/api/thumbnail-proxy?id=${video.id}`);
    const thumbTop = 220;
    const thumbHeight = STORY_WIDTH * (9 / 16);
    const scale = Math.max(STORY_WIDTH / img.width, thumbHeight / img.height);
    const sw = STORY_WIDTH / scale;
    const sh = thumbHeight / scale;
    const sx = (img.width - sw) / 2;
    const sy = (img.height - sh) / 2;
    ctx.drawImage(img, sx, sy, sw, sh, 0, thumbTop, STORY_WIDTH, thumbHeight);

    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.fillRect(0, thumbTop, STORY_WIDTH, thumbHeight);
  } catch {
    // Pas de vignette disponible : on garde le fond dégradé seul.
  }

  ctx.textAlign = "center";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "600 34px Arial";
  ctx.fillText(site.tagline.toUpperCase(), STORY_WIDTH / 2, 130);

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px Arial";
  const titleLines = wrapText(ctx, video.title, STORY_WIDTH - 140).slice(0, 4);
  const titleStartY = 1350;
  titleLines.forEach((line, i) => {
    ctx.fillText(line, STORY_WIDTH / 2, titleStartY + i * 76);
  });

  const url = shortVideoUrl(video.id).replace(/^https?:\/\//, "");
  ctx.font = "bold 38px Arial";
  const urlWidth = ctx.measureText(url).width;
  const pillPaddingX = 36;
  const pillHeight = 68;
  const pillY = STORY_HEIGHT - 190;
  const pillX = STORY_WIDTH / 2 - urlWidth / 2 - pillPaddingX;
  const pillW = urlWidth + pillPaddingX * 2;

  ctx.fillStyle = "rgba(255,255,255,0.15)";
  ctx.beginPath();
  ctx.roundRect(pillX, pillY - pillHeight / 2, pillW, pillHeight, pillHeight / 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.fillText(url, STORY_WIDTH / 2, pillY + 13);

  ctx.fillStyle = "rgba(255,255,255,0.5)";
  ctx.font = "40px Arial";
  ctx.fillText(site.name, STORY_WIDTH / 2, STORY_HEIGHT - 90);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/png");
  });
}

/**
 * Partage l'image "story" d'un morceau via la feuille de partage native
 * (qui propose Instagram/Snapchat/WhatsApp Story sur mobile). Sans support
 * du partage de fichiers, l'image est simplement téléchargée.
 */
export async function shareTrackStory(
  video: UploadedVideo,
  site: { name: string; tagline: string },
): Promise<"shared" | "downloaded" | "failed"> {
  const blob = await generateStoryImage(video, site);
  if (!blob) return "failed";

  const file = new File([blob], `${video.id}.png`, { type: "image/png" });
  const url = shortVideoUrl(video.id);

  if (
    typeof navigator !== "undefined" &&
    navigator.canShare?.({ files: [file] })
  ) {
    try {
      await navigator.share({
        files: [file],
        title: video.title,
        text: `${video.title} — ${site.name}\n${url}`,
        url,
      });
      return "shared";
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return "shared";
      }
    }
  }

  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = `${video.title.replace(/[^\w-]+/g, "-")}.png`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(objectUrl);
  return "downloaded";
}
