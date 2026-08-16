# Ma Vitrine

Site vitrine pour présenter des musiques composées par IA, avec un module de
statistiques YouTube en direct (abonnés, vues totales, vues par morceau).

## Démarrer en local

```bash
npm install
npm run dev
```

Le site est disponible sur [http://localhost:3000](http://localhost:3000).

Sans configuration, le site fonctionne déjà : il affiche un morceau
d'exemple et un message indiquant que les statistiques YouTube ne sont pas
encore configurées.

## Ajouter vos morceaux

Éditez `src/data/tracks.ts` et ajoutez une entrée par morceau :

```ts
{
  id: "mon-morceau",
  title: "Titre du morceau",
  description: "Style, prompt ou modèle d'IA utilisé (Suno, Udio...)",
  youtubeId: "ID_DE_LA_VIDEO", // la partie après ?v= dans l'URL YouTube
  tags: ["Suno", "Lofi"],
  releaseDate: "2026-03-01",
}
```

Chaque morceau devient une carte sur la page d'accueil avec le lecteur
YouTube et le nombre de vues.

## Configurer les statistiques YouTube (abonnés + vues)

1. Créez une clé API dans la [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   avec l'API **YouTube Data API v3** activée.
2. Récupérez l'ID de votre chaîne (commence par `UC...`), visible dans
   `https://www.youtube.com/account_advanced`.
3. Copiez `.env.example` vers `.env.local` et renseignez les valeurs :

   ```bash
   cp .env.example .env.local
   ```

   ```env
   YOUTUBE_API_KEY=votre_cle_api
   YOUTUBE_CHANNEL_ID=UCxxxxxxxxxxxxxxxxxxxxxx
   NEXT_PUBLIC_YOUTUBE_CHANNEL_URL=https://www.youtube.com/@votre-chaine
   ```

4. Relancez `npm run dev`. La page d'accueil affiche alors les abonnés, les
   vues totales de la chaîne et les vues par morceau, actualisées
   automatiquement toutes les 5 minutes côté client (et mises en cache 10
   minutes côté serveur pour préserver le quota de l'API).

Sans clé API, le site reste pleinement fonctionnel : seul l'encart de
statistiques affiche un message d'invitation à la configuration, et le
nombre de vues par morceau n'apparaît simplement pas.

## Déploiement

Le projet est une application Next.js standard, déployable sur
[Vercel](https://vercel.com/new) ou tout hébergeur supportant Next.js.
Pensez à renseigner les variables d'environnement (`YOUTUBE_API_KEY`,
`YOUTUBE_CHANNEL_ID`, `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL`) dans les
paramètres du projet chez votre hébergeur.

## Stack technique

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- API YouTube Data v3 pour les statistiques
