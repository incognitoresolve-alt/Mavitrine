# Ma Vitrine

Site vitrine pour présenter des musiques composées par IA. La liste des
morceaux et les statistiques (abonnés, vues totales, vues par morceau) sont
entièrement automatiques : elles viennent de votre chaîne YouTube via
l'API YouTube Data v3, sans aucune intervention manuelle.

## Démarrer en local

```bash
npm install
npm run dev
```

Le site est disponible sur [http://localhost:3000](http://localhost:3000).

## Ajouter des morceaux

Rien à faire ici : chaque vidéo publiée publiquement sur votre chaîne
YouTube apparaît automatiquement sur la page d'accueil (titre, vignette,
date de publication, nombre de vues), triée de la plus récente à la plus
ancienne. Publiez une nouvelle vidéo sur YouTube, elle apparaît sur le site
au prochain rafraîchissement (voir les délais de cache ci-dessous) — aucune
modification de code n'est nécessaire.

Techniquement, la page lit la playlist "uploads" de la chaîne (toutes ses
vidéos publiques) via `getChannelUploads()` dans `src/lib/youtube.ts`.

## Configurer les statistiques et la liste des morceaux

L'ID de chaîne et l'URL publique sont déjà codés en dur dans
`src/lib/config.ts` (ce ne sont pas des secrets, ils sont visibles par
n'importe qui sur YouTube). La **seule** chose à configurer est la clé API :

1. Créez une clé API dans la [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   avec l'API **YouTube Data API v3** activée.
2. Copiez `.env.example` vers `.env.local` et renseignez la clé :

   ```bash
   cp .env.example .env.local
   ```

   ```env
   YOUTUBE_API_KEY=votre_cle_api
   ```

3. Relancez `npm run dev`. La page d'accueil affiche alors la liste des
   morceaux, les abonnés, les vues totales de la chaîne et les vues par
   morceau. Les stats globales (encart abonnés) sont réactualisées côté
   client toutes les 5 minutes ; la liste des morceaux et les vues sont
   mises en cache 10 minutes côté serveur, pour préserver le quota de
   l'API.

Sans clé API, le site reste utilisable mais vide : la liste de morceaux et
l'encart de statistiques affichent chacun un message invitant à configurer
`YOUTUBE_API_KEY`.

> ⚠️ **`.env` / `.env.local` ne doivent jamais être commités.** Ils sont
> ignorés par `.gitignore` — ne forcez jamais leur ajout (`git add -f`) et
> ne collez jamais de clé API réelle dans `.env.example`, qui est un
> gabarit public. Une clé committée sur GitHub doit être considérée comme
> compromise même après suppression du fichier, car elle reste dans
> l'historique Git : régénérez-la immédiatement dans la Google Cloud
> Console si cela arrive. Cloudflare ne lit de toute façon jamais les
> fichiers du dépôt pour configurer un Worker déployé — voir la section
> suivante pour la bonne méthode (secret Cloudflare).

## Déploiement sur Cloudflare Workers

Le projet est prêt à être déployé sur Cloudflare Workers via
l'[adaptateur OpenNext](https://opennext.js.org/cloudflare) (`@opennextjs/cloudflare`),
déjà installé et configuré (`wrangler.jsonc`, `open-next.config.ts`).

1. Connectez-vous à votre compte Cloudflare :

   ```bash
   npx wrangler login
   ```

2. Renseignez la clé API en tant que **secret** (jamais commité) — c'est la
   seule variable requise, l'ID de chaîne et l'URL sont déjà dans le code :

   ```bash
   npx wrangler secret put YOUTUBE_API_KEY
   ```

3. Testez en local avec le runtime Cloudflare (workerd), via un fichier
   `.dev.vars` (non commité, même contenu que `.env.local`) :

   ```bash
   npm run cf:preview
   ```

4. Déployez :

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
`wrangler deploy`), ce qui provoque l'erreur
`Could not find compiled Open Next config, did you run the build command?`.

`wrangler.jsonc` déclare bien un `build.command` (`npm run cf:build`) que
`wrangler deploy` est censé exécuter lui-même avant de packager le Worker —
et ça fonctionne en local (`npx wrangler deploy --dry-run`). **Mais dans le
pipeline CI réel de Cloudflare (Workers Builds), ce n'est pas fiable** :
`wrangler` y délègue directement à `opennextjs-cloudflare deploy` sans
exécuter l'étape de build personnalisée, probablement à cause du cache de
build restauré entre les runs. Ne comptez donc pas dessus pour ce mode de
déploiement.

➡️ **Réglage obligatoire** : dans Settings → Build de votre projet,
changez la **Build command** de `npm run build` vers :

```
npm run cf:build
```

et laissez la **Deploy command** telle quelle (`npx wrangler deploy`).
Sans ce changement, le déploiement Git échoue systématiquement avec
l'erreur ci-dessus.

Pensez aussi à renseigner `YOUTUBE_API_KEY` comme **secret** (pas
variable) dans Settings → Variables and Secrets du projet — sans quoi le
site se déploie mais reste sans morceaux ni statistiques YouTube. C'est la
seule variable nécessaire.

⚠️ Ne changez jamais le script `build` de `package.json` pour qu'il appelle
`opennextjs-cloudflare build` : cet outil exécute lui-même `npm run build`
en interne pour compiler Next.js, donc le rendre circulaire provoque une
récursion infinie (le build ne termine jamais et consomme toute la
mémoire).

### Autres hébergeurs

Le projet reste une application Next.js standard, donc également
déployable sur [Vercel](https://vercel.com/new) ou tout hébergeur
supportant Next.js, en renseignant `YOUTUBE_API_KEY` dans les paramètres du
projet (jamais dans un fichier commité).

## Stack technique

- [Next.js](https://nextjs.org/) (App Router) + TypeScript
- [Tailwind CSS](https://tailwindcss.com/)
- API YouTube Data v3 pour les statistiques
