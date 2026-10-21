# ReSolv

A problem-solving platform with an original scroll-driven Three.js entrance and a calm, multi-page product behind it. Built independently in this repository.

## Run locally

Use Node.js 22.12+ and npm. This checkout was verified with Node 26.8.2.

```sh
npm ci
npm run setup
npm run dev
```

Open [ReSolv locally](http://127.0.0.1:3000). Setup generates a random local session secret, creates the SQLite file, generates the Prisma client, applies migrations and seeds reference categories/engagement types. It is safe to rerun and never creates fictional customers or opportunities. Keep `.env` and database files private; both are ignored by Git.

Create an account, then set your role in Portfolio. Choose Company / founder to publish a problem. Student and freelancer accounts can browse, save, apply, register, create teams and share portfolio work. Passwords require 12 characters; Better Auth handles password hashing and secure persistent sessions. Administrator status cannot be assigned through public signup or profile changes.

```sh
npm run admin:grant -- existing-account@example.com
```

The command above deliberately grants administrator access to an existing account in the configured database; run it only for a trusted operator.

## Product areas

| Route           | Purpose                                                                  |
| --------------- | ------------------------------------------------------------------------ |
| `/`             | The Common Form: one six-scene cinematic scroll journey                  |
| `/explore`      | All published problems, search, skills, categories, engagement filters   |
| `/hackathons`   | Competition discovery and access to registration, submission and results |
| `/freelance`    | Freelance briefs, budgets, proposals and project entry                   |
| `/collaborate`  | Team discovery, creation and membership requests                         |
| `/talent`       | Public professional profiles and evidence-based discovery                |
| `/people/[id]`  | Public portfolio, self-reported projects and confirmed achievements      |
| `/portfolio`    | Profile settings, projects and achievement management                    |
| `/dashboard`    | Role-aware applications, competitions, teams and project workspace       |
| `/post-problem` | Three-step brief creation, review, draft saving and publication          |
| `/about`        | Short editorial philosophy                                               |
| `/companies`    | Company introduction                                                     |
| `/admin`        | Authorized moderation, organization verification and activity            |

Existing `/arena`, `/teams`, `/workspace` and `/post` links redirect to their canonical pages. Problem details remain accessible through listing dialogs and `/explore?problem=ID`; existing API/auth routes are retained.

## Working journeys

- Company profile → optional organization → draft/review/publish a problem → review/shortlist/accept proposals.
- Solver → profile → transparent deterministic fit score → save/apply → track application status.
- Competition → register → submit or update project links → private organizer review → rubric scores → deadline-gated published results → organizer-confirmed achievement.
- Team → create/discover → request membership → owner approval, or invitation → invited-user acceptance. Active members can associate a competition submission with their team.
- Accepted proposal → solver confirms participation → organizer creates milestones → solver submits deliverables → organizer approves completed milestones → project completion. These are project records; no funds are collected, held or paid.
- Portfolio → add projects explicitly labeled self-reported → share a public profile. Authentication data and email are excluded from public talent responses.

## Design and motion

The supplied IGLOO recording informed continuous camera travel, coordinated deconstruction, deep framing and reverse assembly. ReSolv uses its own geometry, materials and identity. See [recording analysis](docs/REDESIGN_AUDIT.md) and [scroll storyboard](docs/SCROLL_STORYBOARD.md).

Anime.js seeks a paused timeline from normalized native scroll progress, controlling typography, the SVG progress path and the scene signal. Three.js renders original beveled mineral segments with physically based materials, procedural bump texture, a generated environment, lighting and shadows. Motion owns route/navigation transitions, filtered layouts, forms and dialogs. Rendering is event-driven, pixel ratio is capped, offscreen rendering pauses, and mobile uses fewer pieces. Reduced motion and a Simple view provide a static composition; unavailable WebGL falls back to an original SVG.

Instrument Serif, Manrope and IBM Plex Mono are self-hosted through Fontsource; their packages use SIL Open Font License 1.1. Dependencies retain their own licenses. See [animation audit](docs/ANIMATION_AUDIT.md).

## Verify

```sh
npm run typecheck
npm run lint
npm run build
npm test
```

`npm test` needs the production build. Integration tests create a disposable SQLite database from the checked-in migration SQL, start an isolated server on port 3101, exercise real authentication and authorized workflows, then remove their test records/database. AI credentials are blanked in tests so verification cannot make model calls. The SQLite Prisma deploy command was also verified separately against the development database.

For visual QA with clearly labeled examples in an isolated database:

```sh
npm run build
npm run preview:examples
```

Open [the disposable example preview](http://127.0.0.1:3102). It creates only local QA accounts and explicitly illustrative records. Stop with Ctrl+C to remove that temporary database. This preview never writes to your normal `.env` database and never enables AI calls. The normal app starts empty.

## Configuration and deployment

Copy `.env.example` or use `npm run setup`. Set `DATABASE_URL`, a random 32+ character `BETTER_AUTH_SECRET`, and the exact public HTTPS `BETTER_AUTH_URL` for deployment. Auth origin checks use this URL. Deploy a Node runtime with durable storage; never place the local database on an ephemeral serverless filesystem.

PostgreSQL is supported through `@prisma/adapter-pg`. Setting a `postgresql://` connection selects the PostgreSQL Prisma schema and separate migration history automatically. Generate for that provider **before building**:

```sh
npm run db:generate
npm run db:deploy
npm run db:seed
npm run build
npm start
```

The PostgreSQL schema and migration SQL are supplied; a live PostgreSQL integration was not tested because no server/credential was provided. Do not apply the SQLite migration history to PostgreSQL or switch an existing database in place without a reviewed data migration.

Optional AI drafting uses a server-only provider boundary. Configure `AI_API_KEY`, `AI_BASE_URL` and `AI_MODEL` to enable it. The UI requires a human review before publication. The adapter follows the [official Chat Completions API](https://developers.openai.com/api/reference/resources/chat); it was verified in its unavailable state, without a live paid request. Matching is deterministic and works without AI credentials.

## New Render deployment

[`render.yaml`](render.yaml) defines one new free Node web service in Singapore. Supply your external PostgreSQL `DATABASE_URL` during initial Blueprint setup; this configuration creates no Render database. Render generates the authentication secret, and the application uses `RENDER_EXTERNAL_URL` as its auth URL automatically. For a custom domain, set `BETTER_AUTH_URL` explicitly.

Connect this repository in Render → New → Blueprint, provide the database URL, review the new resource name, and deploy. The build installs locked dependencies, generates the PostgreSQL Prisma client, and builds Next.js. Startup applies PostgreSQL migrations, seeds only reference categories, then listens on `0.0.0.0` using Render's `PORT`. `/api/health` returns 200 only when the database responds and never reveals connection details.

Use a separate empty database for ReSolv, with the TLS parameters required by your provider. You can supply the connection locally through the ignored `.env.render.local` file for deployment through the Render connector. Free web services sleep after 15 minutes without traffic; database persistence and limits depend on your external provider. See [Render's free-plan limits](https://render.com/docs/free).

## Current limits

This is a functional local MVP, not a production-certified marketplace. See [verification and limitations](docs/VERIFICATION.md). Email verification/password recovery delivery, production object storage, real payments/subscriptions, distributed rate limiting, dispute operations, multiple delegated judges, eligibility automation, employer invitations to paid work, full messaging, and a general conversational AI assistant remain unconfigured or incomplete. File upload and billing actions are not exposed. Profile skills/interests are currently stored as comma-separated fields; problem skills use a normalized join table. No unverifiable work is labeled platform-verified.
