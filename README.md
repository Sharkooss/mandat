# MANDAT

> De militant local à statue sur une place publique — ou à cadavre dans une limousine.

Jeu narratif de gestion politique jouable dans le navigateur. Gratuit, sans compte : toute la partie tourne côté client (React), la sauvegarde vit dans le `localStorage`. Le conteneur ne sert que des fichiers statiques via nginx — **pas de base de données, pas de volume**.

- **Stack** : Vite 7 · React 19 · TypeScript · Tailwind CSS 4 · Zustand
- **Port interne** : `80` (nginx)
- **Healthcheck** : `GET /healthz`
- **Design du contenu** : [docs/design/france.md](docs/design/france.md)

## Déploiement sur le VPS

Prérequis : DNS `A` de `mandat.louis-nectoux.fr` pointé vers le VPS, Traefik déjà en place avec le réseau externe `web` et le resolver `letsencrypt`.

```bash
cd /srv/docker/apps
git clone <url-du-repo> mandat
cd mandat
cp .env.example .env
nano .env                      # APP_DOMAIN=mandat.louis-nectoux.fr
docker compose up -d --build
docker compose logs -f
```

Variables obligatoires (`.env`) :

| Variable     | Rôle                                   |
| ------------ | -------------------------------------- |
| `APP_DOMAIN` | Domaine routé par Traefik (Host rule)  |

Aucune migration, aucun volume, aucun secret applicatif.

## Déploiement automatique (CI)

Le workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml) build le projet à chaque push sur `main`, puis se connecte au VPS en SSH et exécute `git pull` + `docker compose up -d --build` dans `/srv/docker/apps/mandat`.

Secrets à créer dans le repo GitHub (Settings → Secrets and variables → Actions) :

| Secret        | Valeur                                              |
| ------------- | --------------------------------------------------- |
| `VPS_HOST`    | `92.222.247.229`                                    |
| `VPS_USER`    | l'utilisateur SSH du VPS                            |
| `VPS_SSH_KEY` | la clé privée SSH (contenu du fichier, format PEM)  |

Premier déploiement : cloner le repo sur le VPS à la main (commandes ci-dessus) — la CI ne fait ensuite que le mettre à jour.

## Développement local

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # tsc + vite build → dist/
```

En mode dev, le store est exposé dans la console : `window.mandat.getState()`.

## Structure

```
src/
  engine/     # moteur : état, RNG déterministe, tours, campagne, contexte d'effets
  content/
    france/   # tout le contenu France : casting, segments, intrigues, crises, fins
  ui/         # écrans React
  store.ts    # orchestration des actes (Zustand, persist localStorage)
```

Ajouter un pays = ajouter un dossier `content/<pays>/` (données + événements + fins). Le moteur n'a rien de spécifique à la France.
