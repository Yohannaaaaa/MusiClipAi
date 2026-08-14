# MusiClip AI

Générez un clip vidéo à partir d'une chanson, d'un personnage (photos ou description) et d'une direction visuelle — inspiré du flux "Music Video" d'OpenArt.ai.

## Démarrer en développement

```bash
npm install
npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000). La page d'accueil (`/`) est la couverture, le formulaire de génération est sur `/create`.

## Scripts

| Commande | Description |
| --- | --- |
| `npm run dev` | Serveur de développement (Turbopack) |
| `npm run build` | Build de production |
| `npm run start` | Sert le build de production |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Vérification des types |

## Stockage des fichiers (Vercel Blob)

La chanson et les photos sont envoyées directement du navigateur vers Vercel Blob (aucun octet ne transite par une fonction serverless, donc pas de limite de taille de requête). Cela nécessite un store Blob relié au projet Vercel :

1. Dashboard Vercel → onglet **Storage** → **Create Database** → **Blob** → connecter au projet.
2. La variable `BLOB_READ_WRITE_TOKEN` est alors injectée automatiquement (redéployez si besoin).
3. En local, récupérez-la avec `vercel env pull .env.development.local`.

Sans ce store, l'upload échoue à l'étape d'autorisation (`/api/blob-upload`).

## Fournisseur de génération vidéo

Par défaut, `VIDEO_PROVIDER` vaut `mock` : `/api/generate` renvoie une réponse simulée décrivant les entrées reçues (y compris les URLs Blob), sans produire de vraie vidéo.

### Activer Runway (vraie génération vidéo)

1. Créez un compte sur [runwayml.com](https://runwayml.com) (des crédits d'essai gratuits sont offerts à l'inscription, puis c'est payant à l'usage).
2. **Account Settings → API Keys** → créez une clé.
3. Dans Vercel (ou `.env.local` en local) : `VIDEO_PROVIDER=runway` et `RUNWAY_API_KEY=<votre clé>`.

Limites à connaître :
- Runway anime une **photo** (image → vidéo) : il faut au moins une photo de personnage (mode « Importer des photos »). Sans photo, la génération échoue avec un message explicite plutôt que d'appeler l'API pour rien.
- Chaque clip généré dure environ 10 secondes, pas la durée totale de la chanson.
- La génération prend 1 à 3 minutes : `/api/generate` retourne immédiatement `{ status: "processing", jobId }`, et le front interroge `/api/status?jobId=...` toutes les 5 s jusqu'à `completed`/`failed` (voir `lib/video-provider.ts` et `app/create/page.tsx`).

Pour connecter un autre service (Pika, Kling, Luma, ...), voir `lib/video-provider.ts` et `CLAUDE.md`.

## Photos des cartes "Lieux" et "Style de danse" (Pexels)

Les cartes de la page `/create` affichent une vraie photo (via l'API Pexels) par-dessus le dégradé de secours. Sans clé, ou si Pexels est indisponible, le dégradé + icône reste affiché — aucune casse.

1. Créez un compte gratuit sur [pexels.com/api](https://www.pexels.com/api) et générez une clé API (immédiate, sans validation à attendre).
2. Ajoutez `PEXELS_API_KEY=<votre clé>` dans Vercel (Environment Variables) ou `.env.local`.

Les requêtes vers Pexels sont mises en cache 7 jours (`lib/pexels.ts`, `next: { revalidate }`) pour rester largement sous les quotas gratuits.

## Comptes utilisateurs + historique des clips (Neon + Auth.js)

Trois connexions possibles : Google, email + mot de passe, ou lien magique par email. Une fois connecté, chaque
génération est enregistrée et visible sur `/history`. Sans configuration, l'app fonctionne quand même : la
sauvegarde d'historique échoue silencieusement (best-effort) et la génération continue de répondre normalement.

Variables d'environnement à ajouter sur Vercel :

| Variable | D'où vient-elle | Obligatoire pour |
| --- | --- | --- |
| `DATABASE_URL` | Injectée automatiquement en connectant une base **Neon** au projet (Vercel → Storage → Neon) | Comptes + historique |
| `AUTH_SECRET` | À générer vous-même (`npx auth secret` en local, ou une chaîne aléatoire longue) | Obligatoire dès que Auth.js est utilisé |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google Cloud Console → *APIs & Services* → *Credentials* → *Create OAuth client ID* (type "Web application"). URI de redirection à autoriser : `https://<votre-domaine>/api/auth/callback/google` | Connexion Google |
| `AUTH_RESEND_KEY` | [resend.com](https://resend.com) → compte gratuit → API Keys | Lien magique par email |
| `EMAIL_FROM` (optionnel) | Une adresse d'expéditeur. Sans domaine vérifié sur Resend, gardez la valeur par défaut `MusiClip AI <onboarding@resend.dev>` (fonctionne uniquement pour tester avec l'email du compte Resend) | Lien magique par email |

Après avoir connecté Neon, appliquez le schéma (tables `user`, `account`, `session`, `verificationToken`,
`generation`) avec :

```bash
DATABASE_URL="<votre chaîne de connexion Neon>" npm run db:push
```

La connexion Google + mot de passe fonctionnent sans Resend ; le lien magique seul nécessite `AUTH_RESEND_KEY`.
