# Database Schema

See prisma/schema.prisma for executable normalized local schema. User, Session, Account, Verification implement Better Auth. Domain relations connect profiles, organizations and memberships, categories, skills, problems, applications, saved records, teams, invitations, hackathons, registrations, submissions, criteria, scores, results, contracts, milestones, deliverables, achievements, portfolios, notifications, reports, audits and payment records.

Unique compound constraints prevent duplicate participation. Every private read must be scoped to owner or membership. Verification provenance and payment status must never be inferred from mere completion. PostgreSQL variant: prisma/schema.postgresql.prisma.
