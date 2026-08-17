// L'ID de chaîne et l'URL publique ne sont pas des secrets (ils sont visibles
// par n'importe qui sur YouTube) : ils sont codés en dur ici plutôt que
// dépendre de variables d'environnement, pour que le site fonctionne sans
// configuration supplémentaire. Seule la clé API (YOUTUBE_API_KEY) doit être
// définie comme secret — voir src/lib/youtube.ts et le README.
export const siteConfig = {
  name: "Ma Vitrine",
  tagline: "Musiques composées par IA",
  description:
    "Découvrez mes créations musicales générées par intelligence artificielle.",
  youtubeChannelId:
    process.env.YOUTUBE_CHANNEL_ID || "UCO7zj3S4D0TyHZPMR2_kMFg",
  youtubeChannelUrl:
    process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_URL || "https://youtube.com/@bprodb",
  // URL publique du site déployé (ex: https://mavitrine.example.com), utilisée
  // pour résoudre les images Open Graph en absolu. Sans elle, Next.js retombe
  // sur "http://localhost:3000" dans les balises sociales en production.
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || undefined,
};
