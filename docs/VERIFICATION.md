# Verification — 21 October 2026

## Build and service checks

- Strict TypeScript: passed.
- ESLint: passed without warnings.
- Next.js production build: passed; explicit pages and API routes compiled successfully.
- SQLite migration creation/application and idempotent deploy: passed.
- PostgreSQL adapter/schema/migration SQL: supplied; no live PostgreSQL server was available for integration testing.
- Regression suite: 27 checks passed, including nested workflow cases. It uses real Better Auth, an isolated migrated SQLite database and a production server.

The tests cover authentication and privileged-role injection, anonymous/private access, drafts and publication, cross-origin rejection, field validation, save/unsave, proposal duplicates and privacy, organizer acceptance, project state transitions, deliverable permissions and milestone completion, competition registration and private submissions, rubric bounds and results publication, team approvals and invitations, portfolio provenance, unavailable AI, admin moderation/verification, route aliases, public-profile data selection, and audit/security headers. Choreography tests cover deterministic reversal, finite transforms at 1,001 positions, mobile piece reduction, static reduced-motion poses and subscription cleanup.

## Browser verification

The supplied recording was inspected through 16 extracted keyframes before the redesign. Browser checks then used desktop and 390px mobile viewports and an isolated, visibly labeled example database.

Observed and verified:

- A single persistent 3D scene changes from stacked bands to exploded pieces and then a resolved interlocking form.
- Reverse scrolling retraces the deconstruction. Camera position/orientation and individual piece poses change with progress.
- Typography, progress indicator and geometry remain coordinated after correcting a one-event signal lag.
- Initial and final compositions, the direct story skip and Simple view work. Simple view measured one viewport of story height; no horizontal overflow was present.
- Dark mode changes the physical environment and product surfaces. Mobile mounts one scene canvas with reduced geometry and responsive framing.
- Global/mobile navigation reaches dedicated pages. Opening the mobile menu focuses its first link.
- Real sign-in opens student and company workspaces.
- Freelance filtering and brief dialogs work; Save changes to Saved after a successful database write.
- Escape closes the dialog and restores focus to its originating listing.
- The three-step organizer form preserves the brief, engagement type and deadline, and saves a database-backed DRAFT that appears under My problems. A browser-discovered date handoff issue was fixed by capturing visible named form fields before advancing.
- Talent discovery opens the public portfolio and clearly labels self-reported work separately from confirmed outcomes.

Screenshots are in `docs/screenshots/`. They include the opening/resolution, mobile entrance, static dark alternative, marketplace, workspace and public talent examples. Example records belong only to a disposable QA database; the normal application database is not populated with fictional customers or opportunities.

Semantic headings, labels, keyboard operation, focus restoration, reduced-motion code paths and horizontal overflow were reviewed. Main light-theme muted and action text were darkened after calculating contrast; body text colors meet at least 4.5:1 against their intended primary backgrounds. This was a focused manual review, not a formal WCAG certification. Automated assistive-technology testing, a real WebGL-context-loss simulation and device-level GPU profiling were not performed.

## Dependencies and performance limits

Runtime-only npm audit reported zero vulnerabilities. Full audit reported five high-severity development-tool findings in the eslint-config-next → fast-glob → micromatch/braces chain. npm's proposed remediation downgrades the Next lint configuration across major versions; it was not applied blindly. These tools are not part of the runtime dependency graph. Recheck advisories before production CI adoption.

The scene is lazy-loaded, event-rendered, capped in pixel ratio, simplified on mobile, paused offscreen and disposed on unmount. Fonts are self-hosted. No Lighthouse/Core Web Vitals score or real-device performance guarantee is claimed.

## Remaining product and infrastructure limits

- No live PostgreSQL connection was configured. Local persistence is SQLite; PostgreSQL deployment needs provider-specific client generation and migration verification.
- Email verification/password recovery delivery is not configured. No recovery success is simulated.
- AI drafting has a server-only provider boundary and an honest unavailable state; no paid model call was executed. A general conversational assistant is incomplete.
- File storage is an unavailable-by-default interface; uploads are not exposed.
- Real payments, escrow, subscriptions and commissions are not implemented or enabled.
- Distributed rate limiting, abuse/fraud operations, dispute resolution, delegated multi-judge access, automated eligibility policies and advanced recruitment/messaging remain incomplete.
- Some statuses are validated service strings rather than database enums; profile skills/interests are comma-separated MVP fields. Audit events are persisted, but production observability and multi-instance operational controls need further work.

The deliverable is a working local MVP with a completed UI/motion redesign. It is not described as a fully production-ready marketplace. No external hosting, paid service activation or production data migration was performed.

## Render deployment preparation — 2026-10-21

- Added a new-service Blueprint, PostgreSQL migration/seed startup, public interface binding, database health endpoint, and Render-assigned auth URL fallback.
- `npm run check`: TypeScript, ESLint, Next production build, and all 30 tests passed.
- Secret scan of publishable source found no credential patterns; local `.env`, SQLite files, generated clients and build outputs are excluded from Git.
- Render workspace inspection found that ThreadLabs already occupies its sole free PostgreSQL slot. No existing service or database was modified. Provisioning a separate paid database requires the user's spending approval.
