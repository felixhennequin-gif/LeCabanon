# CLAUDE.md — LeCabanon

Plateforme de partage entre voisins : annuaire de matériel à prêter + annuaire d'artisans recommandés, organisé par communautés (avenue, quartier, ville). Chaque communauté est protégée par un code d'accès ; un utilisateur peut rejoindre plusieurs communautés avec un même compte. Messagerie temps réel entre membres, pages publiques d'artisans, i18n FR/EN via préfixe d'URL.

**Repo** : `felixhennequin-gif/LeCabanon` — monorepo `/backend` + `/frontend` à la racine.

## Stack

| Couche | Techno |
|---|---|
| Backend runtime | Node.js ESM (`"type": "module"`) |
| Backend framework | Express 5 + Socket.io |
| ORM | Prisma 7 + `@prisma/adapter-pg` (PostgreSQL) |
| Auth | JWT (access + refresh) via `jsonwebtoken`, bcryptjs, Google OAuth 2.0 (`passport-google-oauth20`) |
| Validation | Zod 4 (attention : `.issues` et pas `.errors`) |
| Upload | Multer 2 + Sharp (stockage local `backend/uploads/`) |
| Frontend framework | React 19 |
| Frontend build | Vite 8 |
| Routing | React Router v7 |
| Styling | Tailwind CSS v4 via `@tailwindcss/vite` (pas de `tailwind.config.js`) |
| i18n | `react-i18next` + préfixe `/:lang/` |
| SEO | `react-helmet-async` |
| Forms | React Hook Form + Zod |
| Icons | Lucide React (toujours `strokeWidth={1.5}`) |
| TypeScript | v6 des deux côtés |

### Environnement de déploiement

- **Serveur Debian** : `192.168.1.85` (home lab)
- **Dev** : backend `:3001`, frontend Vite `:5173`
- **Prod** : Express sert le build Vite (`../frontend/dist`) via `express.static` + fallback SPA, port `:3002` (géré par pm2 via `ecosystem.config.cjs`)
- **Domaine public** : https://lecabanon.fr (Cloudflare Tunnel → `:3002`)
- **Base de données** : PostgreSQL `lecabanon` (`postgresql://lecabanon_user:lecabanon123@localhost:5432/lecabanon`)

## Branching strategy

- **`main`** = production, jamais de push direct, tout passe par PR.
- **`dev`** = intégration, c'est la base des PRs vers `main`.
- **`feature/<nom>`** = créées depuis `dev`, mergées dans `dev`.
- **`hotfix/<nom>`** = créées depuis `main`, mergées dans `main` ET `dev`.

Workflow : `dev` → `feature/x` → PR → CI verte → merge `dev` → quand stable, PR `dev` → `main`.

### CI (`.github/workflows/ci.yml`)

Déclenchée sur push/PR vers `main` et `dev`. Deux jobs en parallèle :
- **backend** : service PostgreSQL 16 → `prisma generate` → `prisma migrate deploy` → `tsc --noEmit` → `npm run build`
- **frontend** : `npm run lint` → `tsc -b` → `npm run build`

## Architecture backend

```
backend/
├── prisma/
│   ├── schema.prisma         # Source of truth
│   ├── migrations/           # Migrations SQL
│   └── seed.ts               # Catégories informatives
├── src/
│   ├── app.ts                # Express (cors, json, cookieParser, routes, static uploads)
│   ├── server.ts             # HTTP + Socket.io + listen
│   ├── socket.ts             # Socket.io : auth JWT, send/typing/read/online
│   ├── controllers/
│   │   ├── auth.ts           # register/login/refresh/me
│   │   ├── google-auth.ts    # Google OAuth callback
│   │   ├── communities.ts    # CRUD communautés
│   │   ├── equipment.ts      # CRUD matériel
│   │   ├── artisans.ts       # CRUD artisans + reviews
│   │   ├── reviewReplies.ts  # Réponses artisan aux avis
│   │   ├── claim.ts          # Revendication fiche artisan (token email)
│   │   ├── messages.ts       # Conversations, messages (cursor), replies
│   │   ├── feed.ts           # Flux d'activité communauté
│   │   ├── invitations.ts    # Liens d'invitation
│   │   ├── contact.ts        # Formulaire contact site
│   │   ├── pages.ts          # Pages statiques éditables (site admin)
│   │   └── opengraph.ts      # Aperçus de liens externes
│   ├── middlewares/
│   │   ├── authenticate.ts   # JWT → req.userId
│   │   ├── requireMember.ts  # Membership → req.communityRole
│   │   ├── requireSiteAdmin.ts
│   │   └── errorHandler.ts   # AppError + Zod
│   ├── routes/               # auth, users, communities, equipment, artisans, messages, feed, invitations, contact, pages, opengraph
│   └── utils/
│       ├── jwt.ts            # generate/verify access & refresh
│       ├── prisma.ts         # Instance singleton (../generated/prisma)
│       └── upload.ts         # Multer + Sharp resize
└── generated/prisma/         # Client Prisma généré (gitignored)
```

## Architecture frontend

```
frontend/
├── index.html                # Plus Jakarta Sans + script anti-flash dark mode
├── src/
│   ├── main.tsx
│   ├── App.tsx               # Routes (i18n prefix, layouts)
│   ├── index.css             # Design system : @theme, :root, .dark (CSS vars)
│   ├── i18n.ts               # react-i18next init
│   ├── layouts/
│   │   ├── PublicLayout.tsx  # Landing / pages marketing / pages publiques artisans
│   │   ├── AuthLayout.tsx    # Login / Register
│   │   └── AppLayout.tsx     # App authentifiée (header + drawer)
│   ├── lib/
│   │   ├── api.ts            # fetch wrapper + refresh auto sur 401
│   │   └── socket.ts         # Client Socket.io
│   ├── hooks/
│   │   ├── useTheme.ts       # Dark mode
│   │   └── useLocalizedNavigate.ts
│   ├── contexts/
│   │   └── AuthContext.tsx
│   ├── components/
│   │   ├── LanguageRouter.tsx  # Parse /:lang/ prefix
│   │   ├── LocalizedLink.tsx   # <Link> qui préserve la langue
│   │   ├── LanguageSelector.tsx
│   │   ├── SEO.tsx             # react-helmet-async wrapper
│   │   ├── Avatar.tsx
│   │   ├── StarRating.tsx
│   │   ├── FeedList.tsx
│   │   ├── LinkPreview.tsx
│   │   ├── MobileDrawer.tsx
│   │   └── ProtectedRoute.tsx
│   ├── pages/
│   │   ├── public/            # Landing, Features, Pricing, About, Legal, Terms, Contact, NotFound
│   │   ├── Login.tsx / Register.tsx
│   │   ├── Communities.tsx / CommunityDetail.tsx / CommunityAdmin.tsx
│   │   ├── Equipment.tsx / EquipmentDetail.tsx
│   │   ├── Artisans.tsx / ArtisanDetail.tsx / ArtisanPublicProfile.tsx
│   │   ├── Members.tsx / UserProfile.tsx / Profile.tsx
│   │   ├── Messages.tsx       # Temps réel, reply/quote
│   │   ├── InvitationLanding.tsx / VerifyClaim.tsx
│   │   └── SiteAdmin.tsx      # Admin global (pages, contact messages)
│   └── locales/
│       ├── fr/{common,app}.json
│       └── en/{common,app}.json
└── public/                    # favicon, icons, manifest
```

## Modèle de données (Prisma)

| Modèle | Champs clés | Notes |
|---|---|---|
| **User** | email, password?, firstName, lastName, photo?, googleId?, bio?, isSiteAdmin | password nullable (Google OAuth) |
| **Community** | name, description, accessCode (unique), createdById | Code auto-généré, régénérable |
| **CommunityMember** | userId + communityId (composite), role (ADMIN \| MEMBER) | Créateur = ADMIN auto |
| **Invitation** | token, communityId, expiresAt, maxUses, usedCount, revoked | Liens partagés |
| **Equipment** | name, description, category, photos[], ownerId, communityId | Scoped à une communauté |
| **EquipmentPhoto** | url, equipmentId | Multi-photos |
| **Artisan** | name, company?, category, zone?, phone?, email?, website?, bio?, certifications[], hours?, claimed | Multi-communauté via jonction |
| **ArtisanCommunity** | artisanId + communityId | Partage entre communautés |
| **ArtisanPhoto** | url, artisanId | Galerie profil |
| **ArtisanClaim** | artisanId, token, expiresAt, email | Vérification par email |
| **Review** | rating (1-5), comment, visibility (PUBLIC \| COMMUNITY), artisanId, authorId | Visibility = avis, pas artisan |
| **ReviewMedia** | url, type (IMAGE \| VIDEO), reviewId, createdAt | |
| **ArtisanReply** | content, reviewId | Réponse artisan (si claimed) |
| **Activity** | type, actorId, communityId, payload JSON | Flux communauté |
| **Conversation** | participant1Id, participant2Id, communityId | Unique triple, participants normalisés (a<b) |
| **Message** | content, status (SENT/DELIVERED/READ), senderId, conversationId, **replyToId?** | Self-relation `MessageReply` |
| **ContactMessage** | name, email, message, read | Formulaire site |
| **SitePage** | slug, titleFr, titleEn, contentFr, contentEn | Pages statiques éditables |

## Routes API

Markers : `[public]` aucune auth, `[auth]` JWT requis, `[member]` + `requireMember`, `[admin]` ADMIN de la communauté, `[siteAdmin]` isSiteAdmin user.

### Auth — `/api/auth`
- `POST /register` `[public]` — inscription email
- `POST /login` `[public]` — → `{ user, accessToken, refreshToken }`
- `POST /refresh` `[public]` — renouveler l'access token
- `GET /me` `[auth]` — profil courant
- `GET /google` + `GET /google/callback` `[public]` — OAuth flow

### Users — `/api/users`
- `PATCH /me` `[auth]` — éditer nom/prénom/bio/photo
- `GET /:id/profile` `[auth]` — profil public d'un membre

### Communities — `/api/communities`
- `POST /` `[auth]` — créer (code auto)
- `POST /join` `[auth]` — rejoindre via code
- `GET /` `[auth]` — mes communautés
- `GET /:id` `[member]` — détail + membres
- `PATCH /:id` `[admin]` — renommer
- `DELETE /:id` `[admin]` — supprimer définitivement
- `POST /:id/regenerate-code` `[admin]`
- `DELETE /:id/members/:userId` `[admin]`

### Equipment — `/api/equipment`
- `POST /community/:communityId` `[member]` — ajouter (multipart photos)
- `GET /community/:communityId` `[member]` — liste (`?category=` filter)
- `GET /:id` `[member]` — détail
- `PATCH /:id` `[auth]` — proprio ou admin
- `DELETE /:id` `[auth]` — proprio ou admin

### Artisans — `/api/artisans`
- `POST /community/:communityId` `[member]`
- `GET /community/:communityId` `[member]` — `?category=` filter
- `GET /:id` `[member]` — détail + avis
- `GET /:id/public` `[public]` — fiche publique
- `PATCH /:id` `[auth]` — créateur / admin / artisan claimed
- `DELETE /:id` `[auth]`
- `POST /:id/reviews` `[member]` — poster avis (+ photos)
- `GET /:id/reviews` `[member]`
- `POST /:id/claim` `[auth]` — revendiquer → email token
- `POST /:id/verify-claim` `[public]` — valider le token
- `POST /:id/reviews/:reviewId/reply` `[auth]` — artisan claimed

### Messages — `/api/conversations`
- `GET /` `[auth]` — mes conversations (avec unread + online)
- `POST /` `[auth]` — créer (body : recipientId, communityId)
- `GET /:id/messages` `[auth]` — cursor-based, `?cursor=` `?limit=`. Inclut `replyTo { id, content, sender }`. Marque aussi les reçus comme lus.
- `POST /:id/messages` `[auth]` — fallback REST avec `{ content, replyToId? }`

**Socket.io** events (auth JWT via `handshake.auth.token`) :
- `send_message` `{ conversationId, content, replyToId? }`
- `mark_read` `{ conversationId }`
- `typing` `{ conversationId }`
- Émissions serveur : `new_message`, `message_sent`, `messages_read`, `conversation_read`, `user_typing`, `user_online`, `user_offline`

### Feed — `/api/feed`
- `GET /community/:id` `[member]` — flux cursor-based

### Invitations — `/api/invite`
- `POST /community/:id` `[admin]` — générer un lien
- `GET /community/:id` `[admin]` — lister
- `DELETE /:token` `[admin]` — révoquer
- `GET /:token` `[public]` — info invitation
- `POST /:token/join` `[auth]` — rejoindre via lien

### Contact — `/api/contact`
- `POST /` `[public]` — message depuis formulaire
- `GET /` `[siteAdmin]` — liste
- `PATCH /:id/read` `[siteAdmin]`

### Pages — `/api/pages`
- `GET /:slug` `[public]` — contenu localisé
- `PATCH /:slug` `[siteAdmin]`

### OpenGraph — `/api/opengraph`
- `GET /?url=` `[auth]` — preview lien (pour sites d'artisans)

## Catégories (hardcoded)

**Matériel** : Jardinage, Bricolage, Nettoyage, Électroportatif, Échelles & échafaudages, Automobile, Déménagement, Cuisine / Réception

**Artisans** : Plomberie, Électricité, Maçonnerie, Peinture, Menuiserie, Paysagisme, Couverture / Toiture, Serrurerie, Chauffage / Climatisation, Nettoyage

Les catégories sont des strings libres en DB, définies en dur côté frontend (i18n keys `equipment.categories.*` et `artisans.categories.*`). Le seed est informatif uniquement.

## Patterns & conventions

- **Tokens** : `accessToken` + `refreshToken` en localStorage. `api()` refresh auto sur 401.
- **Erreurs backend** : `AppError(statusCode, message)` interceptée par `errorHandler`. Zod → 400 avec `.issues[0].message`.
- **Membership** : `requireMember()` injecte `req.communityRole` pour les checks admin downstream.
- **i18n** : URLs `/:lang/...` (`fr` par défaut). Utiliser `<LocalizedLink>` et `useLocalizedNavigate()`, jamais `<Link>` direct. Clés dans `locales/{fr,en}/{common,app}.json`.
- **SEO** : chaque page publique utilise `<SEO titleKey descriptionKey />`, via `react-helmet-async`.
- **Modals** : overlay `fixed inset-0 bg-[var(--color-overlay)]` + `stopPropagation` sur le form.
- **Upload** : multipart → Multer → Sharp resize → `backend/uploads/` (servi par Express static).
- **Message reply/quote** : `replyToId` nullable self-relation. Le front stocke un objet `MessageReplyRef` et affiche un bloc cité avec border-left coloré dans la bulle. Bandeau de reply au-dessus de l'input avec bouton X.

## Design system

Tailwind v4 via plugin Vite. Toutes les couleurs sont des **CSS variables** définies dans `index.css` :
- `@theme` déclare `primary-*`, `accent-*`, `warm-*` (utilities Tailwind)
- `:root` définit les tokens pour light mode
- `.dark` override pour dark mode

Les composants utilisent `bg-[var(--color-card)]`, `text-[var(--color-text-primary)]`, etc. **Jamais** de `dark:*`, `#fff`, `#000`, `bg-white`, `text-white`, `bg-black`, `text-black`, `slate-*`, `gray-*`.

Border-radius tokens : `rounded-[var(--radius-card)]` (14px), `rounded-[var(--radius-button)]` (10px), `rounded-[var(--radius-pill)]` (24px), `rounded-[var(--radius-input)]` (8px).

Typographie : Plus Jakarta Sans via Google Fonts (index.html).

## Features par bloc

- **Bloc 0** ✅ — Setup monorepo, Prisma, auth JWT + Google, CI
- **Bloc 1** ✅ — Communautés (CRUD, codes, invitations, admin, danger zone)
- **Bloc 2** ✅ — Matériel (CRUD + photos + catégories)
- **Bloc 3** ✅ — Artisans (CRUD + avis + claim + réponses + profil éditable + fiche publique)
- **Bloc 4** ✅ — Messagerie temps réel (Socket.io + REST fallback + typing + online + unread + reply/quote)
- **Bloc 5** ✅ — Feed communauté, profil utilisateur, i18n FR/EN, SEO, 404, landing public, site admin

## Commandes

```bash
# Backend
cd backend
npm install
cp .env.example .env
npx prisma generate
npx prisma migrate dev
npm run dev                  # tsx watch → :3001

# Frontend
cd frontend
npm install
npm run dev                  # Vite → :5173

# Database
npx prisma studio
npx prisma migrate dev --name <nom>

# Si la shadow DB est bloquée (P3014, droit refusé) :
# 1. Créer manuellement backend/prisma/migrations/<ts>_<nom>/migration.sql
# 2. psql $DATABASE_URL -f migration.sql
# 3. INSERT dans _prisma_migrations (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
# 4. npx prisma generate

# Deploy
./scripts/setup-db.sh        # Premier setup
./scripts/deploy.sh          # Déploiement complet
pm2 logs lecabanon-api
pm2 restart lecabanon-api

# Git
git checkout dev
git checkout -b feature/<nom>
git push origin feature/<nom>
```

## Comptes de test (seed)

Mot de passe commun : `Test1234!`

| Email | Rôle |
|---|---|
| `felix@lecabanon.fr` | Admin des 3 communautés |
| `sophie.bertrand@email.fr` | Membre |
| `karim@kb-elec.fr` | Artisan (fiche claimed) |
| `jp.dumont@email.fr` | Membre |

**Codes d'accès des communautés seed** : `GUILLON24` (Avenue Guillon), `BELLVUE24` (Belle Vue), `TILLEUL24` (Les Tilleuls).

## Gotchas pour Claude Code

- Backend ESM → imports TOUJOURS avec extension `.js` (`import { x } from "./foo.js"`)
- Client Prisma dans `backend/generated/prisma/`, pas `node_modules/@prisma/client`
- Express 5 → les handlers async propagent automatiquement les erreurs
- Catégories = strings libres en DB, en dur côté front → modifier aux deux endroits
- Zod v4 → `.issues`, pas `.errors`
- React Router v7, pas v6 (APIs subtilement différentes)
- i18n : toute nouvelle route doit passer par `LanguageRouter` et utiliser `LocalizedLink`
- Le logo de `AppLayout` pointe vers `/` (landing publique), pas `/app`
- Dark mode : CSS variables uniquement, jamais `dark:*`
- Pas de `#fff`, `#000`, `bg-white`, `text-white`, `slate-*`, `gray-*` dans les `.tsx`
- Sur fond `bg-primary-600` utiliser `text-[var(--color-page)]`
- L'avis visibility `COMMUNITY` = visible par les membres des communautés de l'auteur (pas uniquement l'auteur)
- Prod : port `:3002`, domaine `https://lecabanon.fr`, pm2 name `lecabanon-api`
- Uploads stockés en local dans `backend/uploads/` (Minio prévu mais pas branché)
- Shadow DB Prisma peut échouer en local (P3014) → voir workaround dans Commandes
- Ne jamais push directement sur `main`
