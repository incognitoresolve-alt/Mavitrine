# ✅ Checklist Sécurité Pré-Déploiement — AKOE YAO / Projets Boris

> Copie de la checklist réutilisable, avec l'audit du code réel de **Mavitrine**
> (site vitrine musique IA, sans compte utilisateur ni base de données) mené
> par Claude le 2026-08-17. `✅` = conforme, `➖` = non applicable à ce projet,
> `❌` = à corriger. Recocher/mettre à jour avant chaque déploiement prod.

## 🔐 Secrets & Configuration

- [x] ✅ Aucun secret (clé API, mot de passe, token) commité dans le code ou l'historique Git
      — purgé de l'historique via `git-filter-repo` ; `.gitignore` ignore `.env*` (sauf `.env.example`).
- [x] ✅ Toutes les valeurs sensibles chargées via variables d'environnement / secrets du provider
      — `YOUTUBE_API_KEY` lu via `process.env` (`src/lib/youtube.ts`), défini comme secret Cloudflare (Bindings), jamais en dur.
- [x] ✅ `.env.example` documente les variables requises sans exposer de vraies valeurs
      — `.env.example` ne contient que des clés vides/commentées.

## 🔑 Authentification & Sessions

- [ ] ➖ Hashage des mots de passe — aucun compte utilisateur sur ce site.
- [ ] ➖ Expiration/révocation de session — aucune session (site 100% public, lecture seule).
- [ ] ➖ Cookies de session `HttpOnly`/`Secure`/`SameSite` — aucun cookie applicatif posé par Mavitrine (seul `localStorage.theme` est utilisé, côté client, pour le thème clair/sombre).
- [ ] ➖ Protection CSRF — aucune action état-modifiante (pas de formulaire, pas de mutation serveur).

## 🛡️ Autorisations & Accès aux données

- [ ] ➖ Vérification d'accès par ressource — toutes les données servies sont publiques (statistiques YouTube publiques), aucune notion d'utilisateur/propriétaire.
- [x] ✅ Principe du moindre privilège — la clé `YOUTUBE_API_KEY` n'est utilisée que côté serveur (jamais exposée au client), portée strictement en lecture sur l'API YouTube Data.

## 🌐 Réseau & Transport

- [x] ✅ HTTPS forcé — servi par Cloudflare Workers (HTTPS + redirection automatique HTTP→HTTPS côté plateforme).
- [x] ✅ En-têtes de sécurité de base — ajoutés dans `next.config.ts` (X-Content-Type-Options, Referrer-Policy, X-Frame-Options, Permissions-Policy).

## 🧹 Validation des entrées

- [x] ✅ Entrées utilisateur validées côté serveur — `id` (thumbnail-proxy) et `ids` (youtube-video-stats) validés par motif regex + plafond de quantité, côté serveur (route handlers).
- [x] ✅ Sorties échappées (XSS) — rendu React (échappement automatique) partout ; seul `dangerouslySetInnerHTML` du layout est une chaîne statique fixe (script d'init du thème), aucune donnée utilisateur.
- [ ] ➖ Limites d'upload de fichiers — aucun upload sur ce site.

## 🧯 Erreurs & Logs

- [x] ✅ Messages d'erreur utilisateur sans détail technique sensible — tous les appels API YouTube sont enveloppés en `try/catch`, renvoient `null`/tableau vide en cas d'échec, jamais la trace brute.
- [x] ✅ Logs sans donnée sensible — aucun `console.log`/`console.error` dans le code source (vérifié).
- [ ] ❌ Suivi des erreurs en production (Sentry ou équivalent) — non configuré. **Décision utilisateur requise** (choix du service, compte, DSN).

## 🔗 Intégrations & Dépendances

- [x] ✅ `npm audit` sans vulnérabilité — `0 vulnerabilities` (vérifié le 2026-08-17).
- [x] ✅ Dépendances à jour — Next 16.3.1, React 19.2.8, Tailwind v4, versions récentes.

## 💾 Continuité

- [x] ✅ Plan de sauvegarde/restauration — pas de base de données ; le site est entièrement reconstructible depuis le dépôt Git (source de vérité) + l'API YouTube (source de contenu). Le déploiement Cloudflare peut être reproduit à tout moment via `npm run cf:deploy`.

## 🐛 Détecteurs de bugs essentiels

- [x] ✅ TypeScript strict + ESLint configurés et passants — `tsconfig.json` (`"strict": true`), `eslint.config.mjs` (core-web-vitals + typescript).
- [x] ✅ Tests unitaires sur la logique critique — ajoutés (Vitest) pour `isShortDuration` et `src/lib/format.ts`.
- [ ] ❌ Sentry en production — non configuré. **Décision utilisateur requise.**
- [x] ✅ CI qui bloque en cas d'échec lint/tests/build — ajoutée (`.github/workflows/ci.yml`).
- [x] ✅ Validation runtime des entrées API — validation regex + plafond sur les routes API (voir "Validation des entrées" ci-dessus).

## 🎯 UX/SEO

- [x] ✅ Page 404 personnalisée — `src/app/not-found.tsx` ajoutée.
- [x] ✅ Call-to-action clair et visible — bouton "S'abonner" en rouge YouTube, sur l'accueil et chaque page morceau.
- [x] ✅ Liens internes pertinents — page morceau ↔ accueil, fil d'Ariane ajouté.
- [ ] ➖ Page de remerciement — pas de formulaire/conversion nécessitant une page de remerciement (le seul "objectif" est l'abonnement YouTube externe).
- [x] ✅ Fil d'Ariane (breadcrumb) — ajouté sur la page morceau (`Accueil > Titre`), avec balisage `BreadcrumbList`.
- [ ] ➖ Études de cas — non pertinent pour une vitrine musicale personnelle.
- [x] ✅ Au moins 5 questions FAQ — section FAQ ajoutée sur l'accueil (contenu factuel sur le fonctionnement du site, balisage `FAQPage`).
- [ ] ➖ Promesse de délai explicite — pas de prestation de service avec délai (musique déjà publiée).
- [x] ✅ CTA optimisé mobile — boutons pleine largeur, site déjà audité mobile-first.
- [x] ✅ `robots.txt` — `src/app/robots.ts` ajouté.
- [x] ✅ Titres de page uniques par route — accueil (métadonnées statiques) + page morceau (`generateMetadata` dynamique par vidéo).
- [x] ✅ Meta descriptions uniques par route — idem, description générée par vidéo sur `/m/[id]`.
- [x] ✅ Images Open Graph — page morceau (vignette YouTube réelle) ; image OG générée pour l'accueil (`src/app/opengraph-image.tsx`).
- [ ] ❌ Témoignages clients réels — aucun. **Ne peut pas être fabriqué** ; à ajouter par l'utilisateur avec de vrais retours (commentaires YouTube, réseaux sociaux, etc.) si souhaité.
- [x] ✅ Texte alternatif sur toutes les images — vérifié (`alt={video.title}`, `alt={siteConfig.name}`, etc.).
- [x] ✅ Schema.org — balisage `Person`/`WebSite`/`FAQPage`/`BreadcrumbList` ajouté (pas de `LocalBusiness` : pas de lieu physique, non pertinent ici).
- [ ] ❌ Page CGU / politique de confidentialité — absente. **Décision utilisateur requise** (nom légal, contact, juridiction — contenu que je ne peux pas inventer à ta place).

---

**Usage recommandé :**
- Copier ce fichier à la racine de chaque repo (`SECURITY_CHECKLIST.md`)
- Cocher avant chaque déploiement prod
- Pour un audit automatisé, demander à Claude de scanner le code contre cette liste
