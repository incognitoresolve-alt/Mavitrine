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

## Déploiement sur Cloudflare Workers

Le projet est prêt à être déployé sur Cloudflare Workers via
l'[adaptateur OpenNext](https://opennext.js.org/cloudflare) (`@opennextjs/cloudflare`),
déjà installé et configuré (`wrangler.jsonc`, `open-next.config.ts`).

1. Connectez-vous à votre compte Cloudflare :

   ```bash
   npx wrangler login
   ```

2. Renseignez la clé API en tant que **secret** (jamais commité) :

   ```bash
   npx wrangler secret put YOUTUBE_API_KEY
   ```

3. Renseignez l'ID de chaîne dans `wrangler.jsonc` (bloc `vars`), ou via :

   ```bash
   npx wrangler secret put YOUTUBE_CHANNEL_ID
   ```

   ⚠️ `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` est une variable **publique**, inlinée
   par Next.js au moment du `build`. Elle doit donc être définie *avant* la
   compilation (dans `wrangler.jsonc` → `vars`, ou en variable d'environnement
   du shell/CI qui lance `npm run cf:deploy`), pas seulement comme secret
   runtime.

4. Testez en local avec le runtime Cloudflare (workerd), via un fichier
   `.dev.vars` (non commité, mêmes clés que `.env.example`) :

   ```bash
   npm run cf:preview
   ```

5. Déployez :

   ```bash
   npm run cf:deploy
   ```

Le build a été vérifié : le Worker généré pèse environ 960 Kio compressés
(gzip), bien sous la limite de 3 Mio du plan gratuit Cloudflare.

### Déploiement automatique via le dashboard Cloudflare (Git)

Si vous connectez le dépôt GitHub directement dans le dashboard Cloudflare
(Workers & Pages → votre projet → Settings → Build), Cloudflare détecte un
projet Next.js et propose par défaut :

- Build command : `npm run build` (= `next build` seul)
- Deploy command : `npx wrangler deploy`

`npm run build` seul ne produit pas `.open-next/` (requis par
`wrangler deploy`). C'est pris en charge automatiquement : `wrangler.jsonc`
déclare un `build.command` (`npm run cf:build`) que **`wrangler deploy`
exécute lui-même** avant de packager le Worker — donc même avec le "Build
command" par défaut du dashboard resté sur `npm run build`, le déploiement
génère bien `.open-next/` et aboutit. Aucun réglage à changer dans le
dashboard pour cette partie.

Pensez en revanche à renseigner `YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID` et
`NEXT_PUBLIC_YOUTUBE_CHANNEL_URL` dans Settings → Variables and Secrets du
projet (secret pour la clé API, variables pour le reste) — sans quoi le
site se déploie mais reste sans statistiques YouTube.

⚠️ Ne changez jamais le script `build` de `package.json` pour qu'il appelle
`opennextjs-cloudflare build` : cet outil exécute lui-même `npm run build`
en interne pour compiler Next.js, donc le rendre circulaire provoque une
récursion infinie (le build ne termine jamais et consomme toute la
mémoire).

### Autres hébergeurs

Le projet reste une application Next.js standard, donc également
déployable sur [Vercel](https://vercel.com/new) ou tout hébergeur
supportant Next.js, en renseignant les mêmes variables d'environnement
(`YOUTUBE_API_KEY`, `YOUTUBE_CHANNEL_ID`, `NEXT_PUBLIC_YOUTUBE_CHANNEL_URL`)
dans les paramètres du projet.

## Stack technique

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- API YouTube Data v3 pour les statistiques
