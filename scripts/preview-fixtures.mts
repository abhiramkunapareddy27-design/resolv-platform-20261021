/** Disposable visual QA fixture. Never writes to DATABASE_URL from .env. */
import {
  mkdtempSync,
  readdirSync,
  readFileSync,
  writeFileSync,
  rmSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { randomBytes } from "node:crypto";
import { spawn } from "node:child_process";
import { createClient } from "@libsql/client";
const directory = mkdtempSync(join(tmpdir(), "resolv-visual-qa-"));
const file = join(directory, "qa.db");
writeFileSync(file, "");
process.env.DATABASE_URL = `file:${file}`;
process.env.BETTER_AUTH_URL = "http://127.0.0.1:3102";
process.env.BETTER_AUTH_SECRET = randomBytes(32).toString("hex");
process.env.RESOLV_PREVIEW_MODE = "examples";
process.env.AI_API_KEY = "";
const client = createClient({ url: process.env.DATABASE_URL });
for (const migration of readdirSync("prisma/migrations")
  .filter((s) => /^\d/.test(s))
  .sort())
  await client.executeMultiple(
    readFileSync(`prisma/migrations/${migration}/migration.sql`, "utf8"),
  );
client.close();
const { db } = await import("../src/lib/db");
for (const name of [
  "Software Development",
  "Artificial Intelligence",
  "Data Science",
  "UI/UX Design",
  "Cybersecurity",
  "Business Strategy",
  "Product Development",
  "Research",
  "Engineering",
  "Creative Work",
])
  await db.category.create({ data: { name } });
for (const name of ["Hackathon", "Freelance", "Collaboration"])
  await db.engagementModel.create({ data: { name } });
const child = spawn(
  process.execPath,
  [
    resolve("node_modules/next/dist/bin/next"),
    "start",
    "--hostname",
    "127.0.0.1",
    "--port",
    "3102",
  ],
  { env: { ...process.env, NODE_ENV: "production" }, stdio: "inherit" },
);
async function cleanup() {
  child.kill("SIGTERM");
  await db.$disconnect();
  rmSync(directory, { recursive: true, force: true });
  process.exit(0);
}
process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
for (let i = 0; i < 100; i++) {
  try {
    if ((await fetch(process.env.BETTER_AUTH_URL + "/api/platform")).ok) break;
  } catch {}
  await new Promise((r) => setTimeout(r, 150));
}
const response = await fetch(
  process.env.BETTER_AUTH_URL + "/api/auth/sign-up/email",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: process.env.BETTER_AUTH_URL,
    },
    body: JSON.stringify({
      name: "Example Organizer",
      email: "organizer@example.invalid",
      password: "Local-QA-password-2026!",
    }),
  },
);
const { user } = (await response.json()) as { user: { id: string } };
await db.user.update({ where: { id: user.id }, data: { role: "COMPANY" } });
const solverResponse = await fetch(
  process.env.BETTER_AUTH_URL + "/api/auth/sign-up/email",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      origin: process.env.BETTER_AUTH_URL,
    },
    body: JSON.stringify({
      name: "Example Solver",
      email: "solver@example.invalid",
      password: "Local-QA-password-2026!",
    }),
  },
);
const solver = (await solverResponse.json()) as { user: { id: string } };
await db.profile.create({
  data: {
    userId: solver.user.id,
    bio: "An illustrative profile in the isolated QA preview. I build thoughtful tools for people and the planet.",
    skills: "TypeScript, Python, Research",
    interests: "Sustainability, Software",
    experience: "Intermediate",
    portfolio: {
      create: {
        projects: {
          create: {
            title: "Example: A rainfall research prototype",
            description:
              "A self-reported example project used to inspect the portfolio experience. This is not a verified production engagement.",
            url: "https://example.com",
            provenance: "SELF_REPORTED",
          },
        },
      },
    },
  },
});
await db.team.create({
  data: {
    name: "Example: The Useful Things Club",
    description:
      "An isolated QA team for people who enjoy turning a small question into something useful.",
    skills: "Research, TypeScript, Design",
    members: {
      create: { userId: solver.user.id, role: "OWNER", status: "ACTIVE" },
    },
  },
});
const examples = [
  [
    "Fieldwork",
    "Help small farms turn rainfall data into better decisions",
    "Data Science",
    "Hackathon",
    "₹50,000 illustrative prize",
    ["Python", "Data analysis", "Research"],
  ],
  [
    "Form & Function",
    "Make financial literacy feel a little more human",
    "UI/UX Design",
    "Freelance",
    "₹30,000–50,000 illustrative budget",
    ["Figma", "UX research", "Prototyping"],
  ],
  [
    "Open Commons",
    "Build a quieter, more useful neighborhood noticeboard",
    "Software Development",
    "Collaboration",
    "Open-source collaboration",
    ["TypeScript", "React", "Accessibility"],
  ],
] as const;
for (const [name, title, category, engagement, reward, skills] of examples) {
  const org = await db.organization.create({
    data: {
      name: `${name} (example)`,
      members: { create: { userId: user.id, role: "OWNER" } },
    },
  });
  const c = await db.category.findUniqueOrThrow({ where: { name: category } });
  const e = await db.engagementModel.findUniqueOrThrow({
    where: { name: engagement },
  });
  const p = await db.problem.create({
    data: {
      title,
      brief:
        "This is an illustrative brief in an isolated visual QA database. Explore how a clear challenge connects people with different skills. Build a thoughtful prototype, document your assumptions, and explain the impact of your approach.",
      deliverables:
        "A working prototype, a short demo, and a clear explanation of the decisions you made.",
      evaluation:
        "Impact, thoughtful execution, and originality. This example is for local testing only.",
      ownerId: user.id,
      organizationId: org.id,
      categoryId: c.id,
      engagementId: e.id,
      difficulty: "Intermediate",
      reward,
      deadline: new Date(Date.now() + 86400000 * 21),
      status: "PUBLISHED",
      isExample: true,
    },
  });
  for (const name of skills) {
    const skill = await db.skill.upsert({
      where: { name },
      create: { name },
      update: {},
    });
    await db.problemSkill.create({
      data: { problemId: p.id, skillId: skill.id },
    });
  }
  if (engagement === "Hackathon")
    await db.hackathon.create({
      data: {
        problemId: p.id,
        rules: "Local example only. No real prize is offered.",
        eligibility: "QA participants only.",
        criteria: {
          create: [
            { name: "Impact" },
            { name: "Execution" },
            { name: "Originality" },
          ],
        },
      },
    });
}
console.log(
  "Disposable example preview ready at http://127.0.0.1:3102. Stop with Ctrl+C to remove all QA records.",
);
