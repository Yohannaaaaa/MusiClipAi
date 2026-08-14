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

## Fournisseur de génération vidéo

Aucune clé API n'est configurée par défaut : `VIDEO_PROVIDER` vaut `mock` et l'API `/api/generate` renvoie une réponse simulée décrivant les entrées reçues, sans produire de vraie vidéo.

Pour connecter un vrai service (Runway, Pika, Kling, ...), voir `lib/video-provider.ts` et `CLAUDE.md`.
