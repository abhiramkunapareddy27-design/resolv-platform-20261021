import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import {
  mkdtempSync,
  writeFileSync,
  rmSync,
  readFileSync,
  readdirSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { randomBytes } from "node:crypto";
import type { PrismaClient } from "../generated/prisma/client";
const folder = mkdtempSync(join(tmpdir(), "resolv-integration-"));
const database = join(folder, "test.db");
writeFileSync(database, "");
const base = "http://127.0.0.1:3101";
process.env.DATABASE_URL = `file:${database}`;
process.env.BETTER_AUTH_URL = base;
process.env.BETTER_AUTH_SECRET = randomBytes(32).toString("hex");
process.env.AI_API_KEY = "";
const childEnv = { ...process.env };
delete childEnv.NODE_TEST_CONTEXT;
let db: PrismaClient;
let server: ChildProcess;
let serverOutput = "";
type Actor = { id: string; cookie: string; email: string };
let company: Actor, solver: Actor, outsider: Actor;
let categoryId = "",
  freelanceId = "",
  hackathonId = "",
  problemId = "",
  competitionId = "",
  applicationId = "",
  submissionId = "",
  contractId = "",
  milestoneId = "",
  teamId = "";
async function request<T = Record<string, unknown>>(
  path: string,
  actor?: Actor,
  body?: Record<string, unknown>,
  origin = base,
) {
  const r = await fetch(base + path, {
    method: body ? "POST" : "GET",
    headers: {
      ...(actor ? { cookie: actor.cookie } : {}),
      ...(body ? { "Content-Type": "application/json", origin } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, data: (await r.json()) as T, response: r };
}
async function action(
  name: string,
  actor: Actor,
  body: Record<string, unknown> = {},
) {
  return request("/api/platform", actor, { action: name, ...body });
}
async function signup(name: string): Promise<Actor> {
  const email = `${name.toLowerCase()}@test.invalid`;
  const r = await request<{ user: { id: string } }>(
    "/api/auth/sign-up/email",
    undefined,
    { name, email, password: randomBytes(24).toString("hex"), role: "ADMIN" },
  );
  assert.equal(r.status, 200, serverOutput);
  return {
    id: r.data.user.id,
    email,
    cookie: r.response.headers
      .getSetCookie()
      .map((s) => s.split(";")[0])
      .join("; "),
  };
}
function brief(engagementId: string, title: string, status = "PUBLISHED") {
  return {
    title,
    brief:
      "A real test brief with enough context to define the challenge and its expected outcomes for participants.",
    deliverables:
      "A documented working prototype and a short explanation of the decisions made.",
    evaluation:
      "Impact, execution, and originality. Open to registered participants.",
    categoryId,
    engagementId,
    difficulty: "Intermediate",
    reward: "Unpaid test collaboration",
    deadline: new Date(Date.now() + 86400000 * 3).toISOString(),
    skills: ["TypeScript", "Research"],
    commercialUse: false,
    ipTerms:
      "Creators retain ownership. Any commercial license requires a separate written agreement.",
    status,
  };
}
before(
  async () => {
    const migrationClient = (await import("@libsql/client")).createClient({
      url: process.env.DATABASE_URL!,
    });
    for (const migration of readdirSync("prisma/migrations")
      .filter((name) => /^\d/.test(name))
      .sort()) {
      await migrationClient.executeMultiple(
        readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"),
      );
    }
    migrationClient.close();
    db = (await import("../src/lib/db")).db;
    const category = await db.category.create({
      data: { name: "Software Development" },
    });
    categoryId = category.id;
    freelanceId = (
      await db.engagementModel.create({ data: { name: "Freelance" } })
    ).id;
    hackathonId = (
      await db.engagementModel.create({ data: { name: "Hackathon" } })
    ).id;
    server = spawn(
      process.execPath,
      [
        resolve("node_modules/next/dist/bin/next"),
        "start",
        "--hostname",
        "127.0.0.1",
        "--port",
        "3101",
      ],
      {
        env: { ...childEnv, NODE_ENV: "production" },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    server.stdout?.on("data", (c) => (serverOutput += String(c)));
    server.stderr?.on("data", (c) => (serverOutput += String(c)));
    let ready = false;
    for (let i = 0; i < 100; i++) {
      try {
        const r = await fetch(base + "/api/platform");
        if (r.ok) {
          ready = true;
          break;
        }
      } catch {}
      await new Promise((r) => setTimeout(r, 150));
    }
    assert.equal(ready, true, serverOutput);
    company = await signup("Company");
    solver = await signup("Solver");
    outsider = await signup("Outsider");
  },
  { timeout: 30000 },
);
after(async () => {
  server?.kill("SIGTERM");
  if (db) await db.$disconnect();
  rmSync(folder, { recursive: true, force: true });
});
test("critical platform workflows and authorization", async (t) => {
  await t.test(
    "unauthenticated writes and dashboard reads are denied",
    async () => {
      assert.equal(
        (await request("/api/platform", undefined, { action: "team" })).status,
        401,
      );
      assert.equal((await request("/api/platform?view=dashboard")).status, 401);
    },
  );
  await t.test(
    "signup role injection is ignored and profile admin escalation is denied",
    async () => {
      assert.equal(
        (await db.user.findUniqueOrThrow({ where: { id: company.id } })).role,
        "STUDENT",
      );
      assert.equal(
        (
          await action("profile", solver, {
            name: "Solver",
            role: "ADMIN",
            bio: "",
            skills: "",
            interests: "",
            availability: "",
            github: "",
            linkedin: "",
            website: "",
          })
        ).status,
        400,
      );
    },
  );
  await t.test(
    "company profile unlocks publishing while student publishing is denied",
    async () => {
      assert.equal(
        (
          await action("profile", company, {
            name: "Company",
            role: "COMPANY",
            bio: "Building useful tools.",
            skills: "TypeScript",
            interests: "Software",
            availability: "Open",
            github: "",
            linkedin: "",
            website: "",
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await action(
            "problem",
            solver,
            brief(freelanceId, "An unauthorized problem"),
          )
        ).status,
        403,
      );
    },
  );
  await t.test("drafts stay private and owners can publish them", async () => {
    const b = brief(freelanceId, "Build a useful test prototype", "DRAFT");
    const r = await action("problem", company, b);
    assert.equal(r.status, 200);
    problemId = String(r.data.id);
    const publicData = await request<{ problems: { id: string }[] }>(
      "/api/platform",
    );
    assert.equal(
      publicData.data.problems.some((p) => p.id === problemId),
      false,
    );
    assert.equal(
      (
        await action("problem", outsider, {
          ...b,
          id: problemId,
          status: "PUBLISHED",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await action("problem", company, {
          ...b,
          id: problemId,
          status: "PUBLISHED",
        })
      ).status,
      200,
    );
  });
  await t.test(
    "cross-origin writes and invalid fields are blocked",
    async () => {
      assert.equal(
        (
          await request(
            "/api/platform",
            solver,
            { action: "save", id: problemId },
            "https://evil.invalid",
          )
        ).status,
        403,
      );
      assert.equal(
        (await action("apply", solver, { id: problemId, proposal: "short" }))
          .status,
        400,
      );
    },
  );
  await t.test("saved opportunities persist and can be removed", async () => {
    assert.equal((await action("save", solver, { id: problemId })).status, 200);
    let d = await request<{ saved: unknown[] }>(
      "/api/platform?view=dashboard",
      solver,
    );
    assert.equal(d.data.saved.length, 1);
    await action("save", solver, { id: problemId });
    d = await request("/api/platform?view=dashboard", solver);
    assert.equal(d.data.saved.length, 0);
  });
  await t.test(
    "proposal creation rejects duplicates and hides other users’ records",
    async () => {
      const r = await action("apply", solver, {
        id: problemId,
        proposal:
          "I will build a small working prototype, test it with users, and document the decisions.",
        estimate: "Two weeks",
      });
      assert.equal(r.status, 200);
      applicationId = String(r.data.id);
      assert.equal(
        (
          await action("apply", solver, {
            id: problemId,
            proposal:
              "A second valid proposal that should never create a duplicate application.",
          })
        ).status,
        409,
      );
      const d = await request<{ applications: unknown[] }>(
        "/api/platform?view=dashboard",
        outsider,
      );
      assert.equal(d.data.applications.length, 0);
    },
  );
  await t.test(
    "only organizer can accept a proposal and create one project",
    async () => {
      assert.equal(
        (
          await action("application-status", outsider, {
            id: applicationId,
            status: "ACCEPTED",
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await action("application-status", company, {
            id: applicationId,
            status: "ACCEPTED",
          })
        ).status,
        200,
      );
      contractId = (
        await db.contract.findUniqueOrThrow({ where: { applicationId } })
      ).id;
      assert.equal(
        (
          await action("application-status", company, {
            id: applicationId,
            status: "DECLINED",
          })
        ).status,
        400,
      );
      assert.equal(await db.contract.count(), 1);
    },
  );
  await t.test(
    "project states and milestone completion enforce both parties",
    async () => {
      assert.equal(
        (
          await action("contract-state", outsider, {
            id: contractId,
            status: "ACTIVE",
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await action("contract-state", solver, {
            id: contractId,
            status: "ACTIVE",
          })
        ).status,
        200,
      );
      assert.equal(
        (
          await action("milestone", company, {
            id: contractId,
            title: "Working prototype",
            amount: 0,
          })
        ).status,
        200,
      );
      milestoneId = (
        await db.milestone.findFirstOrThrow({ where: { contractId } })
      ).id;
      assert.equal(
        (await action("complete-milestone", company, { id: milestoneId }))
          .status,
        400,
      );
      assert.equal(
        (
          await action("deliver", outsider, {
            id: milestoneId,
            url: "https://example.com",
            notes: "No access",
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await action("deliver", solver, {
            id: milestoneId,
            url: "javascript:alert(1)",
            notes: "Invalid",
          })
        ).status,
        400,
      );
      assert.equal(
        (
          await action("deliver", solver, {
            id: milestoneId,
            url: "https://example.com/prototype",
            notes: "Ready for review",
          })
        ).status,
        200,
      );
      assert.equal(
        (await action("complete-milestone", company, { id: milestoneId }))
          .status,
        200,
      );
      assert.equal(
        (
          await action("contract-state", company, {
            id: contractId,
            status: "COMPLETED",
          })
        ).status,
        200,
      );
      assert.equal(await db.paymentRecord.count(), 0);
    },
  );
  await t.test(
    "competition registration and submissions are database backed and private",
    async () => {
      const r = await action(
        "problem",
        company,
        brief(hackathonId, "A focused test hackathon"),
      );
      assert.equal(r.status, 200);
      competitionId = String(r.data.id);
      const submission = {
        id: competitionId,
        title: "A working solution",
        description:
          "We built a focused solution and tested the outcome with representative inputs.",
        github: "https://github.com/example/test",
        demo: "",
      };
      assert.equal((await action("submit", solver, submission)).status, 400);
      assert.equal(
        (await action("register", solver, { id: competitionId })).status,
        200,
      );
      assert.equal(
        (await action("register", solver, { id: competitionId })).status,
        409,
      );
      assert.equal((await action("submit", solver, submission)).status, 200);
      submissionId = (await db.submission.findFirstOrThrow()).id;
      assert.equal(
        (
          await request(
            `/api/platform?view=submissions&id=${competitionId}`,
            outsider,
          )
        ).status,
        403,
      );
      assert.equal(
        (
          await request(
            `/api/platform?view=submissions&id=${competitionId}`,
            company,
          )
        ).status,
        200,
      );
    },
  );
  await t.test(
    "scoring and results publication require organizer authority and a complete rubric",
    async () => {
      const h = await db.hackathon.findUniqueOrThrow({
        where: { problemId: competitionId },
        include: { criteria: true },
      });
      const scores = h.criteria.map((c) => ({ criterionId: c.id, value: 8 }));
      assert.equal(
        (await action("score", outsider, { id: submissionId, scores })).status,
        403,
      );
      assert.equal(
        (
          await action("score", company, {
            id: submissionId,
            scores: [{ criterionId: h.criteria[0].id, value: 99 }],
          })
        ).status,
        400,
      );
      assert.equal(
        (await action("publish-results", company, { id: competitionId }))
          .status,
        400,
      );
      await db.problem.update({
        where: { id: competitionId },
        data: { deadline: new Date(Date.now() - 1000) },
      });
      assert.equal(
        (await action("publish-results", company, { id: competitionId }))
          .status,
        400,
      );
      assert.equal(
        (await action("score", company, { id: submissionId, scores })).status,
        200,
      );
      assert.equal(
        (await action("publish-results", company, { id: competitionId }))
          .status,
        200,
      );
      assert.equal(
        (await action("score", company, { id: submissionId, scores })).status,
        400,
      );
      const results = await request<{ results: { rank: number }[] }>(
        `/api/platform?view=results&id=${competitionId}`,
      );
      assert.equal(results.status, 200);
      assert.equal(results.data.results[0].rank, 1);
      assert.equal(
        (await db.achievement.findFirstOrThrow()).provenance,
        "ORGANIZER_CONFIRMED",
      );
    },
  );
  await t.test(
    "team requests require owner approval and invitations require the invited user",
    async () => {
      const r = await action("team", solver, {
        name: "Curious Minds",
        description: "We build useful projects with different perspectives.",
        skills: "TypeScript, Research",
      });
      assert.equal(r.status, 200);
      teamId = String(r.data.id);
      assert.equal(
        (await action("join-team", outsider, { id: teamId })).status,
        200,
      );
      assert.equal(
        (
          await action("team-member", outsider, {
            id: teamId,
            userId: outsider.id,
            status: "ACTIVE",
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await action("team-member", solver, {
            id: teamId,
            userId: outsider.id,
            status: "ACTIVE",
          })
        ).status,
        200,
      );
      assert.equal(
        (await action("invite", solver, { id: teamId, email: company.email }))
          .status,
        200,
      );
      const invite = await db.invitation.findFirstOrThrow();
      assert.equal(
        (await action("accept-invite", outsider, { id: invite.id })).status,
        403,
      );
      assert.equal(
        (await action("accept-invite", company, { id: invite.id })).status,
        200,
      );
    },
  );
  await t.test(
    "portfolio records remain self-reported and AI cannot fabricate a configured provider",
    async () => {
      assert.equal(
        (
          await action("portfolio", solver, {
            title: "A personal project",
            description: "A project I built and documented for my portfolio.",
            url: "https://example.com/project",
          })
        ).status,
        200,
      );
      assert.equal(
        (await db.portfolioProject.findFirstOrThrow()).provenance,
        "SELF_REPORTED",
      );
      assert.equal(
        (
          await action("ai-brief", company, {
            description:
              "Write a useful problem brief from this fairly detailed project description.",
          })
        ).status,
        503,
      );
    },
  );
  await t.test(
    "admin routes enforce role, moderation and organization verification",
    async () => {
      assert.equal(
        (await request("/api/platform?view=admin", solver)).status,
        403,
      );
      assert.equal(
        (
          await action("report", solver, {
            id: problemId,
            reason: "Review the disclosure and ownership terms.",
          })
        ).status,
        200,
      );
      assert.equal(
        (await action("moderate", solver, { id: problemId, status: "REMOVED" }))
          .status,
        403,
      );
      await db.user.update({
        where: { id: outsider.id },
        data: { role: "ADMIN" },
      });
      const organization = await action("organization", company, {
        name: "A real test organization",
        description: "A disposable verification test record.",
      });
      assert.equal(organization.status, 200);
      assert.equal(
        (
          await action("verify-organization", solver, {
            id: organization.data.id,
            status: "VERIFIED",
          })
        ).status,
        403,
      );
      assert.equal(
        (
          await action("verify-organization", outsider, {
            id: organization.data.id,
            status: "VERIFIED",
          })
        ).status,
        200,
      );
      assert.equal(
        (await request("/api/platform?view=admin", outsider)).status,
        200,
      );
      assert.equal(
        (
          await action("moderate", outsider, {
            id: problemId,
            status: "REMOVED",
          })
        ).status,
        200,
      );
      const pub = await request<{ problems: { id: string }[] }>(
        "/api/platform",
      );
      assert.equal(
        pub.data.problems.some((p) => p.id === problemId),
        false,
      );
    },
  );
  await t.test(
    "dedicated routes and legacy aliases remain reachable",
    async () => {
      for (const route of [
        "/",
        "/explore",
        "/hackathons",
        "/freelance",
        "/collaborate",
        "/talent",
        "/portfolio",
        "/dashboard",
        "/post-problem",
        "/about",
      ]) {
        const response = await fetch(base + route);
        assert.equal(response.status, 200, route);
      }
      for (const [oldPath, newPath] of [
        ["/arena", "/hackathons"],
        ["/workspace", "/dashboard"],
        ["/teams", "/collaborate"],
        ["/post", "/post-problem"],
      ]) {
        const response = await fetch(base + oldPath, { redirect: "manual" });
        assert.equal(response.status, 307);
        assert.equal(
          new URL(response.headers.get("location")!, base).pathname,
          newPath,
        );
      }
    },
  );
  await t.test(
    "talent discovery shares portfolio evidence without email or account data",
    async () => {
      const response = await request<{
        people: {
          id: string;
          profile: { portfolio: { projects: unknown[] } };
        }[];
      }>("/api/talent");
      assert.equal(response.status, 200);
      assert.ok(response.data.people.some((person) => person.id === solver.id));
      const text = JSON.stringify(response.data);
      assert.equal(text.includes(solver.email), false);
      assert.equal(text.includes("password"), false);
      const profile = await request("/api/talent?id=" + solver.id);
      assert.equal(profile.status, 200);
      assert.equal((await fetch(base + "/people/" + solver.id)).status, 200);
    },
  );
  await t.test(
    "audit trail exists and production responses have defensive headers",
    async () => {
      assert.ok((await db.auditLog.count()) > 15);
      const r = await fetch(base);
      assert.equal(r.headers.get("x-content-type-options"), "nosniff");
      assert.equal(r.headers.get("x-frame-options"), "DENY");
    },
  );
});
