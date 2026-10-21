# Architecture

Next.js App Router, React, strict TypeScript and semantic CSS tokens. Explicit page modules define each product route. `PlatformApp` supplies the shared shell and loads product views on demand. Old routes redirect to their canonical equivalents. `/people/[id]` supplies public professional profiles through a separate read-only talent API.

Better Auth manages password hashing and persistent Prisma sessions. Public signup cannot assign privileged roles. The platform API delegates to `src/lib/platform-service.ts`; that service owns Zod validation, authorization, workflow state transitions and audit logging. Existing business services and database models were preserved through the cinematic redesign. Public talent queries select professional fields only, never email, credentials, sessions or private submissions.

Prisma uses libSQL/SQLite locally and the PostgreSQL adapter when `DATABASE_URL` starts with a PostgreSQL scheme. `prisma.config.ts` chooses the provider schema and separate migration history. Client generation must happen for the intended provider before building. PostgreSQL migration SQL is present but has not been run against a live server in this environment.

AI drafting uses a server-only provider interface with honest unavailable/error states. The optional adapter uses a compatible Chat Completions endpoint and requires human review before publication. No paid provider request was made. Matching remains deterministic and explains its weighted inputs. Private storage has an unavailable-by-default interface; no upload endpoint or public bucket is exposed. Billing is not enabled.

Deployment needs a Node runtime, durable database, exact HTTPS auth origin, managed secrets, database backups and migrations. The in-memory request limiter is suitable for local/single-process use; distributed rate limiting is still required before multi-instance deployment. Email verification and recovery delivery need a configured mail provider. This is an MVP, not a production certification.
