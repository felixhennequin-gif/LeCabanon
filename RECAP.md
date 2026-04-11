# Récap LeCabanon — 11 avril 2026

## Contexte

LeCabanon est une plateforme de partage entre voisins organisée par communautés (avenue, quartier, ville). Deux fonctionnalités principales :

1. **Annuaire de matériel à prêter** — les membres proposent du matériel (jardinage, bricolage, etc.) consultable et empruntable par les voisins
2. **Annuaire d'artisans recommandés** — les membres recommandent des artisans locaux avec avis, notes et fiches enrichies

Chaque communauté est protégée par un code d'accès. Un utilisateur peut rejoindre plusieurs communautés avec un même compte. Les artisans peuvent revendiquer leur fiche pour enrichir leur profil et répondre aux avis.

**Repo** : `felixhennequin-gif/LeCabanon` (monorepo `/backend` + `/frontend`)

## État actuel

### Phases complétées

| Phase | Statut |
|-------|--------|
| **Phase 1** — Auth (email + Google OAuth) + CRUD communautés | ✅ Complétée |
| **Phase 2** — CRUD matériel + artisans + avis | ✅ Complétée |
| **Phase 3** — Messagerie temps réel (Socket.io) | ✅ Complétée (PR #9) |
| **Phase 4** — Artisans multi-communauté, claim, réponses, profil public | ✅ Complétée (PR #10) |
| **Phase 4b** — UX improvements (dark mode, mobile, equipment detail) | ✅ Complétée (PR #11) |
| **Phase 5** — Feed & Profil | 🔧 Partiellement (feed + profil public OK, profil éditable reste) |
| **Phase 6** — Upload médias & Polish | ❌ Non commencée |

### Ce qui tourne

- **Backend** : Express 5 + Prisma 7 + PostgreSQL, Socket.io pour le temps réel
- **Frontend** : React 19 + Vite 8 + Tailwind v4, design system complet (sage/terracotta, CSS variables, Plus Jakarta Sans)
- **Prod** : pm2 sur port 3002, Express sert le build Vite en static
- **CI** : GitHub Actions sur push/PR vers `main` et `dev` (backend type-check + build, frontend lint + type-check + build)
- **Demo** : script `./scripts/demo.sh` qui installe, build, seed (11 users, 3 communautés, 19 matériels, 10 artisans, 17 avis, messagerie) et démarre pm2

### Branches

- `main` — dernière release stable (PR #3, en retard sur dev)
- `dev` — branche d'intégration, contient tout le travail récent y compris la refonte design system complète
- Branches feature mergées : `feature/messaging` (#9), `feature/artisan-refactor` (#10), `feature/ux-improvements` (#11)

## Travail récent

### Session 11 avril 2026

**Refonte complète du design system (23 fichiers) :**
- **Nouvelle palette** : sage green primary (`#3d7a4a`), terracotta accent (`#c47a4a`), warm neutrals — zéro `#fff` ou `#000` pur
- **CSS custom properties** : toutes les couleurs surface/texte/bordure/sémantique définis dans `:root` (light) et `.dark` (dark) dans `index.css`
- **Typographie** : Plus Jakarta Sans via Google Fonts, variable `--font-sans` appliquée au body
- **Dark mode** : `.dark` class overrides toutes les CSS variables — zéro classe `dark:*` dans les composants `.tsx`
- **Border-radius tokens** : `--radius-card` (14px), `--radius-button` (10px), `--radius-pill` (24px), `--radius-input` (8px)
- **Migration complète** : les 23 fichiers `.tsx` du frontend migrent de classes Tailwind hardcodées (`bg-white`, `text-slate-900`, `dark:bg-slate-800`, etc.) vers des CSS variables (`bg-[var(--color-card)]`, `text-[var(--color-text-primary)]`, etc.)
- **Anti-flash** : script dans `index.html` mis à jour, `lang="fr"`
- **Icons** : `strokeWidth={1.5}` standardisé sur tous les Lucide icons
- **Vérification** : `npm run build` passe, grep confirme zéro pattern interdit restant
- Commit `658ac33` sur `dev`, poussé sur remote

### Session 10 avril 2026

**Fixes infrastructure :**
- Fix `scripts/demo.sh` — le script échouait avec exit code 1 car `pm2 restart` retournait non-zero quand l'app n'était pas dans la process list. Remplacé par un check `pm2 list | grep` avant de décider restart vs start.
- Fix `ecosystem.config.cjs` — le script pointait vers `dist/server.js` mais TypeScript compile dans `dist/src/server.js` (à cause de `include: ["src/**/*"]` dans tsconfig). Corrigé le chemin.
- Fix divergence `dev`/`origin/dev` — rebase local sur remote après merge de PR #11.

**Bug fix — Messages + Artisan public page :**
- **Messages.tsx** : le contexte matériel (quand on clique "Contacter" depuis EquipmentDetail) ne pré-remplissait pas le message. Ajouté un `useEffect` qui injecte le nom du matériel dans l'input. Déplacé le bandeau contextuel sous le header (visible uniquement quand pas encore de messages).
- **ArtisanPublicProfile.tsx** : ajouté le numéro de téléphone (exposé seulement si fiche revendiquée = consentement implicite), CTA de revendication pour les fiches non-claimed (style amber, lien vers login avec redirect), et corrigé le dark mode sur tous les éléments.
- **Backend artisans.ts** : ajouté `phone: artisan.claimed ? artisan.phone : null` dans `getArtisanPublic`.

**Fix dark mode + design system initial :**
- **index.css** : CSS custom properties initiales (`primary-*` vert, `accent-*` terre cuite, `warm-*` jaune pour étoiles), `@custom-variant dark`.
- **index.html** : script anti-flash, logique `t !== 'light'`.
- **useTheme.ts** : helper `resolveIsDark`.
- Migration `gray-*` → `slate-*` dans 22 fichiers, couleur accent appliquée sur badges, CTA, certifications.

### Sessions précédentes (résumé)

**PR #11 — feature/ux-improvements :**
- Dark/light mode avec détection système + toggle manuel
- Navigation mobile avec drawer (burger menu)
- CommunityDetail responsive (header compact sur mobile)
- Page EquipmentDetail avec bouton contact
- Bandeau contexte matériel dans les messages
- Filtre matériel par propriétaire

**PR #10 — feature/artisan-refactor :**
- Schema multi-communauté artisans (table de jonction ArtisanCommunity)
- Système de claim artisan avec vérification email
- Réponses aux avis pour les artisans ayant revendiqué leur fiche
- Page publique artisan (accessible sans auth, SEO-friendly)
- Visibilité avis PUBLIC/COMMUNITY (renommé depuis PRIVATE)
- Seed enrichi avec multi-communauté, claims et réponses

**PR #9 — feature/messaging :**
- Models Conversation + Message avec migration Prisma
- API REST pour les messages
- Socket.io serveur avec auth JWT
- Client Socket.io intégré côté React
- Page Messages avec liste de conversations et chat
- Boutons contact sur les pages matériel, artisan et membres
- Badge messages non-lus dans la navigation

## Architecture

### Stack

| Couche | Technologie |
|--------|-------------|
| **Runtime** | Node.js (ESM) |
| **Backend** | Express 5 |
| **ORM** | Prisma 7 + `@prisma/adapter-pg` |
| **BDD** | PostgreSQL |
| **Auth** | JWT (access + refresh) + Google OAuth (Passport) |
| **Temps réel** | Socket.io |
| **Validation** | Zod 4 |
| **Frontend** | React 19 |
| **Build** | Vite 8 |
| **Routing** | React Router v7 |
| **CSS** | Tailwind CSS v4 (plugin Vite, pas de tailwind.config) |
| **Forms** | React Hook Form + @hookform/resolvers + Zod |
| **Icons** | Lucide React |
| **TypeScript** | v6 (backend + frontend) |
| **CI** | GitHub Actions |
| **Process** | pm2 |

### Structure du projet

```
LeCabanon/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # 12 models
│   │   ├── migrations/            # 6 migrations
│   │   └── seed.ts                # Données démo complètes
│   ├── src/
│   │   ├── app.ts                 # Config Express
│   │   ├── server.ts              # Point d'entrée
│   │   ├── socket.ts              # Socket.io setup
│   │   ├── controllers/           # auth, communities, equipment, artisans
│   │   ├── middlewares/            # authenticate, requireMember, errorHandler
│   │   ├── routes/                # Toutes les routes API
│   │   ├── services/              # activity, etc.
│   │   └── utils/                 # jwt, prisma
│   └── generated/prisma/          # Client Prisma (gitignored)
├── frontend/
│   ├── src/
│   │   ├── index.css              # Design system complet (CSS variables, @theme, :root/.dark)
│   │   ├── App.tsx                # Routes
│   │   ├── lib/api.ts             # Wrapper fetch avec auth auto
│   │   ├── lib/socket.ts          # Client Socket.io
│   │   ├── hooks/useTheme.ts      # Dark mode hook
│   │   ├── contexts/AuthContext.tsx
│   │   ├── components/            # Layout, FeedList, StarRating, etc.
│   │   └── pages/                 # 14 pages
│   └── dist/                      # Build Vite (servi par Express en prod)
├── scripts/
│   ├── demo.sh                    # Setup complet démo
│   ├── deploy.sh                  # Déploiement prod
│   └── setup-db.sh                # Init PostgreSQL
├── ecosystem.config.cjs           # pm2 config (port 3002)
├── .github/workflows/ci.yml       # CI backend + frontend
└── CLAUDE.md                      # Documentation projet
```

### Modèle de données (12 models Prisma)

- **User** — email, password (nullable si Google), Google OAuth
- **Community** — nom, description, code d'accès unique
- **CommunityMember** — many-to-many User↔Community, rôle ADMIN/MEMBER
- **Equipment** — matériel à prêter, scopé à une communauté
- **Artisan** — fiche artisan (peut être partagé entre communautés)
- **ArtisanCommunity** — table de jonction artisan↔communauté
- **Review** — avis 1-5 sur un artisan, visibilité PUBLIC/COMMUNITY
- **ReviewMedia** — photos/vidéos associées aux avis
- **ArtisanReply** — réponses artisan aux avis (si fiche claimed)
- **Activity** — flux d'activité par communauté
- **Invitation** — liens d'invitation avec expiration et max uses
- **Conversation / Message** — messagerie temps réel entre membres

### Design system

**Palette :**

| Token | Couleur | Usage |
|-------|---------|-------|
| `primary-*` | Sage green (`#3d7a4a`) | Boutons principaux, liens, badges catégorie, messages envoyés |
| `accent-*` | Terracotta (`#c47a4a`) | Badge vérifié, claim CTA, certifications, warnings |
| `warm-*` | Warm yellow (`#d4a843`) | Étoiles de notation |

**Surfaces/texte (CSS variables, pas de classes Tailwind directes) :**

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--color-page` | `#f5f2ec` (warm cream) | `#1c1b18` (warm dark) | Body background |
| `--color-card` | `#faf8f5` | `#26251f` | Cartes, panneaux |
| `--color-input` | `#f0ede6` | `#302f28` | Inputs, placeholders |
| `--color-text-primary` | `#2c2a25` | `#e8e4db` | Texte principal |
| `--color-text-secondary` | `#6b6860` | `#9e9a90` | Texte secondaire |
| `--color-text-tertiary` | `#9e9a90` | `#6b6860` | Texte tertiaire |
| `--color-border` | `#e2ddd4` | `#3a3832` | Bordures légères |

**Border-radius tokens :** `--radius-card` (14px), `--radius-button` (10px), `--radius-pill` (24px), `--radius-input` (8px)

**Typographie :** Plus Jakarta Sans (Google Fonts), variable `--font-sans`

**Convention :** Zéro classe `dark:*` dans les `.tsx` — le dark mode fonctionne uniquement via `.dark` overriding les CSS variables dans `index.css`.

## Points restants / TODO

### Court terme (pour merger dev → main)

- [ ] Tester le build de production (`./scripts/demo.sh` complet)
- [ ] Vérifier la CI passe sur la branche `dev`
- [ ] Ouvrir la PR `dev` → `main`

### Phase 5 — Feed & Profil (partiellement fait)

- [x] Route GET `/api/communities/:id/feed` (cursor-based)
- [x] Page feed = page d'accueil communauté
- [x] Page profil public (UserProfile)
- [ ] Page profil éditable (nom, prénom, photo)

### Phase 6 — Upload médias & Polish

- [ ] Brancher Minio (ou stockage local en dev) pour l'upload de photos
- [ ] Upload photos matériel (formulaire + backend multipart)
- [ ] Upload photos/vidéos avis artisans
- [ ] Upload photo de profil
- [ ] Resize avec Sharp avant stockage
- [ ] PWA : manifest + service worker
- [ ] Responsive polish (vérification mobile complète)
- [ ] Page 404

### V1.1 — Backlog

- [ ] Recherche full-text (matériel + artisans)
- [ ] Abonnements (limites par nombre de membres)
- [ ] Modération (signalement faux avis)
- [ ] Notifications push
- [ ] Multi-communautés UX (switcher rapide)

## Commits récents (dev)

```
658ac33 style: design system overhaul — sage/terracotta palette, CSS variables, Plus Jakarta Sans
33f0ff5 feat(seed): add Jacques Urugen (n°6) with real equipment and artisan data
443c004 style: design system with CSS variables — migrate gray→slate, add accent color
5bed658 fix: repair dark mode system — fix body bg, anti-flash, normalize dark: variants
d4ef95f fix: pre-fill message with equipment context + improve artisan public page
11cba11 fix: update pm2 restart logic in demo script and correct server script path
eb1d8b8 Merge pull request #11 from felixhennequin-gif/feature/ux-improvements
9c1ab26 feat: add equipment filter by owner
9cedba7 feat: add conversation context banner for equipment contact
a050dea feat: add equipment detail page with contact button
2ded1c0 style: apply dark mode classes to all components
33ad06f feat: add dark/light mode with system preference and manual toggle
afe478f refactor: responsive CommunityDetail with compact header on mobile
b8981f9 feat: add mobile drawer navigation with burger menu
0f1468d fix: community detail artisan count + clean seed + demo script
6cfa52e Merge pull request #10 from felixhennequin-gif/feature/artisan-refactor
098a644 feat: update seed with multi-community artisans, claims, and replies
1b44042 refactor: fix review visibility labels (PRIVATE -> COMMUNITY)
9319e3a feat: update artisan detail page with claim, replies, and profile edit
78bac88 feat: add public artisan profile page
5f5ee51 feat: add review reply system for claimed artisans
e5e74fd feat: add artisan claim system with email verification
```
